-- =====================================================================
-- FitControl Cloud: seguridad por roles (RLS) + telemetría de licencias
--
-- PROBLEMA QUE CORRIGE: la llave pública (anon / publishable) va dentro del
-- instalador de escritorio y del JavaScript de esta web. Sin RLS, cualquiera
-- podía LEER todas las licencias (con sus claves), los datos de contacto de
-- los clientes y además modificarlas.
--
-- DESPUÉS:
--   * anon (público)  -> solo puede leer planes disponibles (landing page).
--   * panel web       -> acceso según perfiles.rol del usuario autenticado:
--        super_admin / admin  : leer, crear, editar, eliminar
--        manager              : leer, crear, editar
--        otro rol en perfiles : solo lectura
--   * escritorio      -> NUNCA toca las tablas; usa la Edge Function
--                        activar-licencia (service_role).
--
-- ANTES DE EJECUTAR: confirma que tu usuario del panel tiene fila en perfiles.
--   select u.email, p.rol from auth.users u left join public.perfiles p on p.id = u.id;
-- Si te falta, créala (cambia el correo):
--   insert into public.perfiles (id, rol)
--   select id, 'super_admin' from auth.users where email = 'TU_CORREO@dominio.com'
--   on conflict (id) do update set rol = excluded.rol;
-- =====================================================================

-- ---------- 1. Rol del usuario actual (evita recursión de RLS en perfiles) ----------
create or replace function public.rol_panel()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(rol) from public.perfiles where id = auth.uid()
$$;

revoke all on function public.rol_panel() from public, anon;
grant execute on function public.rol_panel() to authenticated;

-- ---------- 2. Telemetría de licencias ----------
alter table public.licencias add column if not exists ultima_validacion timestamptz;
alter table public.licencias add column if not exists version_app text;
alter table public.licencias add column if not exists equipo_nombre text;

create table if not exists public.licencia_eventos (
  id           bigserial primary key,
  licencia_id  bigint,
  clave        text,
  hardware_id  text,
  equipo       text,
  version_app  text,
  resultado    text not null,          -- EXITO, HARDWARE_DISTINTO, LICENCIA_VENCIDA, ...
  creado_en    timestamptz not null default now()
);
create index if not exists ix_licencia_eventos_licencia on public.licencia_eventos (licencia_id, creado_en desc);

-- ---------- 3. Activar RLS y limpiar políticas anteriores ----------
alter table public.licencias        enable row level security;
alter table public.clientes         enable row level security;
alter table public.planes           enable row level security;
alter table public.perfiles         enable row level security;
alter table public.licencia_eventos enable row level security;

do $$
declare p record;
begin
  for p in select policyname, tablename from pg_policies
           where schemaname = 'public'
             and tablename in ('licencias', 'clientes', 'planes', 'perfiles', 'licencia_eventos')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

revoke all on public.licencias, public.clientes, public.licencia_eventos from anon;
revoke insert, update, delete on public.planes from anon;
revoke insert, update, delete on public.perfiles from anon, authenticated;

-- ---------- 4. Licencias ----------
create policy licencias_leer on public.licencias for select to authenticated
  using (public.rol_panel() is not null);
create policy licencias_crear on public.licencias for insert to authenticated
  with check (public.rol_panel() in ('super_admin', 'admin', 'manager'));
create policy licencias_editar on public.licencias for update to authenticated
  using (public.rol_panel() in ('super_admin', 'admin', 'manager'))
  with check (public.rol_panel() in ('super_admin', 'admin', 'manager'));
create policy licencias_eliminar on public.licencias for delete to authenticated
  using (public.rol_panel() in ('super_admin', 'admin'));

-- ---------- 5. Clientes ----------
create policy clientes_leer on public.clientes for select to authenticated
  using (public.rol_panel() is not null);
create policy clientes_crear on public.clientes for insert to authenticated
  with check (public.rol_panel() in ('super_admin', 'admin', 'manager'));
create policy clientes_editar on public.clientes for update to authenticated
  using (public.rol_panel() in ('super_admin', 'admin', 'manager'))
  with check (public.rol_panel() in ('super_admin', 'admin', 'manager'));
create policy clientes_eliminar on public.clientes for delete to authenticated
  using (public.rol_panel() in ('super_admin', 'admin'));

-- ---------- 6. Planes (la landing pública necesita ver los disponibles) ----------
create policy planes_publicos on public.planes for select to anon, authenticated
  using (esta_disponible = true);
create policy planes_leer_panel on public.planes for select to authenticated
  using (public.rol_panel() is not null);
create policy planes_crear on public.planes for insert to authenticated
  with check (public.rol_panel() in ('super_admin', 'admin', 'manager'));
create policy planes_editar on public.planes for update to authenticated
  using (public.rol_panel() in ('super_admin', 'admin', 'manager'))
  with check (public.rol_panel() in ('super_admin', 'admin', 'manager'));
create policy planes_eliminar on public.planes for delete to authenticated
  using (public.rol_panel() in ('super_admin', 'admin'));

-- ---------- 7. Perfiles: cada quien solo ve su propio rol ----------
create policy perfiles_propio on public.perfiles for select to authenticated
  using (id = auth.uid());

-- ---------- 8. Bitácora de activaciones: solo lectura para el panel ----------
create policy eventos_leer on public.licencia_eventos for select to authenticated
  using (public.rol_panel() is not null);

-- ---------- Verificación rápida (como anon debe devolver 0 filas) ----------
-- set role anon; select count(*) from public.licencias; reset role;
