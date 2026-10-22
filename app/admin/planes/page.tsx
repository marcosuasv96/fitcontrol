'use client';

import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useAvisos } from '@/components/avisos';
import { type Plan, type TipoPlan, NOMBRES_TIPO_PLAN, SUFIJO_PRECIO, formatoDinero } from '@/lib/licencias';
import { Boton, BotonIcono, Tarjeta, EncabezadoPagina, EstadoVacio, Esqueleto, Modal, Campo, Entrada, Selector, AreaTexto, Alerta, Interruptor, Insignia, cx } from '@/components/ui';
import { IconoMas, IconoEtiqueta, IconoLapiz, IconoBasura } from '@/components/iconos';

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
                <p className="mt-3 text-sm text-slate-600 line-clamp-3 flex-1">{p.descripcion || 'Sin descripción.'}</p>

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
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    const valor = Number(precio);
    if (!Number.isFinite(valor) || valor < 0) { setError('Escribe un precio válido.'); return; }
    setGuardando(true);
    setError('');
    const datos = { nombre: nombre.trim(), precio: valor, tipo_plan: tipo, descripcion: descripcion.trim() || null };
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
              <Selector id={id} value={tipo} onChange={(e) => setTipo(e.target.value as TipoPlan)}>
                {(Object.keys(NOMBRES_TIPO_PLAN) as TipoPlan[]).map((t) => <option key={t} value={t}>{NOMBRES_TIPO_PLAN[t]}</option>)}
              </Selector>
            )}
          </Campo>
        </div>
        <Campo etiqueta="Descripción" ayuda="Se muestra en la página pública de precios.">
          {(id) => <AreaTexto id={id} rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué incluye este plan?" />}
        </Campo>
      </form>
    </Modal>
  );
}
