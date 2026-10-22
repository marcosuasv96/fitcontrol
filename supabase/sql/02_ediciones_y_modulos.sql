-- =====================================================================
-- FitControl Cloud: ediciones de licencia (Lite / Pro / Vitalicio)
--
-- Cada PLAN define:
--   modulos              -> módulos premium incluidos: 'ventas', 'inventario', 'roles'
--                           (socios, accesos, membresías, caja, reportes y configuración
--                            van SIEMPRE incluidos; no se listan aquí)
--   max_usuarios         -> empleados activos permitidos (NULL = ilimitados)
--   meses_actualizaciones-> NULL = recibe actualizaciones mientras la licencia esté vigente
--                           (planes de pago recurrente). Número = meses desde la emisión
--                           (planes de pago único, p. ej. Vitalicio = 12).
--   incluye_soporte      -> si el plan incluye soporte (mismo periodo que las actualizaciones)
--
-- Cada LICENCIA puede tener:
--   actualizaciones_hasta -> fecha manual que sustituye el cálculo del plan
--                            (para vender una "renovación de actualizaciones" a un vitalicio).
--
-- La Edge Function firma todo esto dentro del token; el escritorio lo lee y no se puede alterar.
-- Ejecutar DESPUÉS de 01_seguridad_y_telemetria.sql.
-- =====================================================================

alter table public.planes add column if not exists modulos text[] not null default '{}';
alter table public.planes add column if not exists max_usuarios integer;
alter table public.planes add column if not exists meses_actualizaciones integer;
alter table public.planes add column if not exists incluye_soporte boolean not null default true;

alter table public.planes drop constraint if exists planes_modulos_validos;
alter table public.planes add constraint planes_modulos_validos
  check (modulos <@ array['ventas', 'inventario', 'roles']::text[]);
alter table public.planes drop constraint if exists planes_max_usuarios_valido;
alter table public.planes add constraint planes_max_usuarios_valido check (max_usuarios is null or max_usuarios >= 1);
alter table public.planes drop constraint if exists planes_meses_actualizaciones_valido;
alter table public.planes add constraint planes_meses_actualizaciones_valido check (meses_actualizaciones is null or meses_actualizaciones >= 0);

alter table public.licencias add column if not exists actualizaciones_hasta timestamptz;

-- ---------------------------------------------------------------------
-- Configuración inicial de tus planes actuales (revisa los nombres antes de ejecutar)
-- ---------------------------------------------------------------------
-- Lite: módulos base, 2 usuarios (dueño + recepción), actualizaciones mientras pague
update public.planes
   set modulos = '{}', max_usuarios = 2, meses_actualizaciones = null, incluye_soporte = true
 where nombre ilike '%lite%';

-- Pro mensual / anual: todo, usuarios ilimitados, actualizaciones mientras pague
update public.planes
   set modulos = array['ventas', 'inventario', 'roles'], max_usuarios = null, meses_actualizaciones = null, incluye_soporte = true
 where nombre ilike '%pro%' and tipo_plan <> 'permanente';

-- Vitalicio: todo como Pro, nunca vence, 12 meses de actualizaciones y soporte
update public.planes
   set modulos = array['ventas', 'inventario', 'roles'], max_usuarios = null, meses_actualizaciones = 12, incluye_soporte = true
 where tipo_plan = 'permanente';

-- Revisión rápida
-- select nombre, tipo_plan, modulos, max_usuarios, meses_actualizaciones, incluye_soporte from public.planes order by precio;
