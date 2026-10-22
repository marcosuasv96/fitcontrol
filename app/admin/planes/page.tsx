'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useAvisos } from '@/components/avisos';
import {
  type Plan, type TipoPlan, type ModuloPremium, NOMBRES_TIPO_PLAN, SUFIJO_PRECIO, MODULOS_PREMIUM, formatoDinero, textoActualizaciones,
} from '@/lib/licencias';
import { Boton, BotonIcono, Tarjeta, EncabezadoPagina, EstadoVacio, Esqueleto, Modal, Campo, Entrada, Selector, AreaTexto, Alerta, Interruptor, Insignia, cx } from '@/components/ui';
import { IconoMas, IconoEtiqueta, IconoLapiz, IconoBasura, IconoCheck, IconoCerrar, IconoUsuarios, IconoRenovar } from '@/components/iconos';

type PlanConConteo = Plan & { licencias: { count: number }[] };

export default function PlanesPage() {
  const { puedeEditar, puedeBorrar } = useSesion();
  const { avisar, confirmar } = useAvisos();
  const [planes, setPlanes] = useState<PlanConConteo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [formulario, setFormulario] = useState<{ plan?: Plan } | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase.from('planes').select('*, licencias(count)').order('precio');
    if (error) avisar(`No se pudieron leer los planes: ${error.message}`, 'error');
    setPlanes((data as PlanConConteo[]) ?? []);
    setCargando(false);
  }, [avisar]);

  // Carga inicial desde Supabase (los setState ocurren al llegar la respuesta)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, [cargar]);

  const alternar = async (p: Plan) => {
    const { error } = await supabase.from('planes').update({ esta_disponible: !p.esta_disponible }).eq('id', p.id);
    if (error) { avisar(`No se pudo cambiar: ${error.message}`, 'error'); return; }
    avisar(p.esta_disponible ? `«${p.nombre}» ya no aparece en la web` : `«${p.nombre}» ahora es visible en la web`);
    cargar();
  };

  const eliminar = async (p: PlanConConteo) => {
    const enUso = p.licencias?.[0]?.count ?? 0;
    const ok = await confirmar({
      titulo: 'Eliminar plan',
      mensaje: enUso > 0
        ? `«${p.nombre}» está asignado a ${enUso} licencia(s). En lugar de eliminarlo, ocúltalo con el interruptor «Visible en la web».`
        : `Se eliminará «${p.nombre}» de forma permanente.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('planes').delete().eq('id', p.id);
    if (error) { avisar(`No se pudo eliminar: ${error.message}`, 'error'); return; }
    avisar('Plan eliminado');
    cargar();
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Planes y precios"
        descripcion="Los planes visibles aparecen en tu página pública y al emitir licencias."
        acciones={puedeEditar && (
          <Boton icono={<IconoMas className="w-4 h-4" />} onClick={() => setFormulario({})} className="w-full sm:w-auto">Nuevo plan</Boton>
        )}
      />

      {cargando ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-56 rounded-2xl" />)}</div>
      ) : planes.length === 0 ? (
        <Tarjeta>
          <EstadoVacio icono={<IconoEtiqueta />} titulo="Aún no hay planes" descripcion="Crea tu primer plan para empezar a emitir licencias."
            accion={puedeEditar && <Boton icono={<IconoMas className="w-4 h-4" />} onClick={() => setFormulario({})}>Nuevo plan</Boton>} />
        </Tarjeta>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {planes.map((p) => {
            const enUso = p.licencias?.[0]?.count ?? 0;
            return (
              <Tarjeta key={p.id} className={cx('p-5 sm:p-6 flex flex-col', !p.esta_disponible && 'bg-slate-50/80')}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <Insignia tono={p.esta_disponible ? 'naranja' : 'gris'}>{NOMBRES_TIPO_PLAN[p.tipo_plan]}</Insignia>
                    <h2 className={cx('mt-3 text-lg font-semibold truncate', p.esta_disponible ? 'text-tinta-900' : 'text-slate-500')}>{p.nombre}</h2>
                  </div>
                  {puedeEditar && (
                    <div className="flex gap-1.5 shrink-0">
                      <BotonIcono etiqueta="Editar plan" onClick={() => setFormulario({ plan: p })}><IconoLapiz className="w-4 h-4" /></BotonIcono>
                      {puedeBorrar && <BotonIcono etiqueta="Eliminar plan" tono="peligro" onClick={() => eliminar(p)}><IconoBasura className="w-4 h-4" /></BotonIcono>}
                    </div>
                  )}
                </div>

                <p className="mt-2">
                  <span className="text-3xl font-bold tracking-tight text-tinta-900 tabular-nums">{formatoDinero(Number(p.precio))}</span>
                  <span className="ml-1.5 text-sm text-slate-500">{SUFIJO_PRECIO[p.tipo_plan]}</span>
                </p>
                <p className="mt-3 text-sm text-slate-600 line-clamp-3">{p.descripcion || 'Sin descripción.'}</p>

                {/* Qué incluye la edición: es lo que se firma en la licencia del escritorio */}
                <ul className="mt-4 space-y-1.5 text-sm flex-1">
                  {MODULOS_PREMIUM.map((m) => {
                    const incluido = (p.modulos ?? []).includes(m.id);
                    return (
                      <li key={m.id} className={cx('flex items-center gap-2', incluido ? 'text-tinta-900' : 'text-slate-400 line-through')}>
                        {incluido ? <IconoCheck className="w-4 h-4 text-emerald-600 shrink-0" /> : <IconoCerrar className="w-4 h-4 shrink-0" />}
                        {m.nombre}
                      </li>
                    );
                  })}
                  <li className="flex items-center gap-2 text-tinta-900">
                    <IconoUsuarios className="w-4 h-4 text-slate-400 shrink-0" />
                    {p.max_usuarios ? `Hasta ${p.max_usuarios} usuarios` : 'Usuarios ilimitados'}
                  </li>
                  <li className="flex items-center gap-2 text-tinta-900">
                    <IconoRenovar className="w-4 h-4 text-slate-400 shrink-0" />
                    {textoActualizaciones(p)}{p.incluye_soporte ? ' y soporte' : ''}
                  </li>
                </ul>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-xs text-slate-500">{enUso} {enUso === 1 ? 'licencia' : 'licencias'}</span>
                  <label className="flex items-center gap-2.5 text-sm text-slate-600">
                    Visible en la web
                    <Interruptor activo={p.esta_disponible} onCambio={() => alternar(p)} etiqueta="Visible en la web" disabled={!puedeEditar} />
                  </label>
                </div>
              </Tarjeta>
            );
          })}
        </div>
      )}

      {formulario && (
        <FormularioPlan
          plan={formulario.plan}
          onCerrar={() => setFormulario(null)}
          onGuardado={(nuevo) => { setFormulario(null); avisar(nuevo ? 'Plan creado' : 'Cambios guardados'); cargar(); }}
        />
      )}
    </div>
  );
}

function FormularioPlan({ plan, onCerrar, onGuardado }: { plan?: Plan; onCerrar: () => void; onGuardado: (nuevo: boolean) => void }) {
  const [nombre, setNombre] = useState(plan?.nombre ?? '');
  const [precio, setPrecio] = useState(plan ? String(plan.precio) : '');
  const [tipo, setTipo] = useState<TipoPlan>(plan?.tipo_plan ?? 'mensual');
  const [descripcion, setDescripcion] = useState(plan?.descripcion ?? '');
  // Edición: por defecto un plan nuevo incluye todo (Pro)
  const [modulos, setModulos] = useState<ModuloPremium[]>(plan?.modulos ?? MODULOS_PREMIUM.map((m) => m.id));
  const [maxUsuarios, setMaxUsuarios] = useState(plan?.max_usuarios ? String(plan.max_usuarios) : '');
  const [mesesActualizaciones, setMesesActualizaciones] = useState(
    plan?.meses_actualizaciones != null ? String(plan.meses_actualizaciones) : (plan ? '' : ''));
  const [soporte, setSoporte] = useState(plan?.incluye_soporte ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const alternarModulo = (m: ModuloPremium) =>
    setModulos((prev) => (prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m]));

  // Al elegir "Permanente" se sugieren 12 meses de actualizaciones (el modelo Vitalicio)
  const cambiarTipo = (t: TipoPlan) => {
    setTipo(t);
    if (t === 'permanente' && mesesActualizaciones === '') setMesesActualizaciones('12');
  };

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(precio);
    if (!Number.isFinite(valor) || valor < 0) { setError('Escribe un precio válido.'); return; }
    const usuarios = maxUsuarios.trim() === '' ? null : Number(maxUsuarios);
    if (usuarios !== null && (!Number.isInteger(usuarios) || usuarios < 1)) { setError('Los usuarios deben ser un número entero mayor a 0, o déjalo vacío para ilimitados.'); return; }
    const meses = mesesActualizaciones.trim() === '' ? null : Number(mesesActualizaciones);
    if (meses !== null && (!Number.isInteger(meses) || meses < 0)) { setError('Los meses de actualizaciones deben ser un número entero, o déjalo vacío.'); return; }
    if (tipo === 'permanente' && meses === null) { setError('Un plan permanente debe indicar cuántos meses de actualizaciones incluye (por ejemplo 12).'); return; }
    setGuardando(true);
    setError('');
    const datos = {
      nombre: nombre.trim(), precio: valor, tipo_plan: tipo, descripcion: descripcion.trim() || null,
      modulos, max_usuarios: usuarios, meses_actualizaciones: meses, incluye_soporte: soporte,
    };
    const { error } = plan
      ? await supabase.from('planes').update(datos).eq('id', plan.id)
      : await supabase.from('planes').insert(datos);
    setGuardando(false);
    if (error) { setError(error.message); return; }
    onGuardado(!plan);
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={plan ? 'Editar plan' : 'Nuevo plan'}
      descripcion={plan ? 'Los cambios de precio no afectan licencias ya emitidas.' : undefined}
      pie={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} className="w-full sm:w-auto">Cancelar</Boton>
          <Boton type="submit" form="form-plan" cargando={guardando} className="w-full sm:w-auto">{plan ? 'Guardar cambios' : 'Crear plan'}</Boton>
        </div>
      }
    >
      <form id="form-plan" onSubmit={guardar} className="space-y-5">
        {error && <Alerta>{error}</Alerta>}
        <Campo etiqueta="Nombre del plan">
          {(id) => <Entrada id={id} required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej. FitControl Pro Anual" />}
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo etiqueta="Precio (MXN)">
            {(id) => (
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                <Entrada id={id} type="number" inputMode="decimal" min="0" step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="1299" className="pl-7 tabular-nums" />
              </div>
            )}
          </Campo>
          <Campo etiqueta="Vigencia">
            {(id) => (
              <Selector id={id} value={tipo} onChange={(e) => cambiarTipo(e.target.value as TipoPlan)}>
                {(Object.keys(NOMBRES_TIPO_PLAN) as TipoPlan[]).map((t) => <option key={t} value={t}>{NOMBRES_TIPO_PLAN[t]}</option>)}
              </Selector>
            )}
          </Campo>
        </div>
        <Campo etiqueta="Descripción" ayuda="Se muestra en la página pública de precios.">
          {(id) => <AreaTexto id={id} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué incluye este plan?" />}
        </Campo>

        {/* ---------- Edición: lo que se firma dentro de la licencia del escritorio ---------- */}
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-slate-700 mb-1.5">Módulos incluidos</legend>
          <p className="text-xs text-slate-500 -mt-1">Socios, accesos, membresías, caja y reportes van en todos los planes.</p>
          {MODULOS_PREMIUM.map((m) => (
            <label key={m.id} className="flex items-start gap-3 rounded-xl border border-slate-200 px-4 py-3 cursor-pointer hover:border-slate-300">
              <input type="checkbox" checked={modulos.includes(m.id)} onChange={() => alternarModulo(m.id)} className="mt-0.5 w-4 h-4 accent-marca-500" />
              <span>
                <span className="block text-sm font-medium text-tinta-900">{m.nombre}</span>
                <span className="block text-xs text-slate-500">{m.descripcion}</span>
              </span>
            </label>
          ))}
        </fieldset>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo etiqueta="Usuarios activos" ayuda="Vacío = ilimitados. Lite: 2.">
            {(id) => <Entrada id={id} type="number" inputMode="numeric" min="1" step="1" value={maxUsuarios} onChange={(e) => setMaxUsuarios(e.target.value)} placeholder="Ilimitados" />}
          </Campo>
          <Campo etiqueta="Meses de actualizaciones" ayuda={tipo === 'permanente' ? 'Contados desde la emisión. Vitalicio: 12.' : 'Vacío = mientras la licencia esté vigente.'}>
            {(id) => <Entrada id={id} type="number" inputMode="numeric" min="0" step="1" value={mesesActualizaciones} onChange={(e) => setMesesActualizaciones(e.target.value)} placeholder="Mientras esté vigente" />}
          </Campo>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-tinta-900">Incluye soporte</p>
            <p className="text-xs text-slate-500">Durante el mismo periodo que las actualizaciones.</p>
          </div>
          <Interruptor activo={soporte} onCambio={() => setSoporte(!soporte)} etiqueta="Incluye soporte" />
        </div>
      </form>
    </Modal>
  );
}
