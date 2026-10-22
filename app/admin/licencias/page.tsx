'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useAvisos } from '@/components/avisos';
import {
  type Licencia, type Plan, type EstadoLicencia, calcularExpiracion, diasRestantes, estadoDe, PRESENTACION_ESTADO,
  NOMBRES_TIPO_PLAN, formatoFecha, formatoDinero, aInputFecha, haceCuanto, generarSerial, enlaceWhatsApp, mensajeEntregaLicencia,
} from '@/lib/licencias';
import {
  Boton, BotonIcono, Tarjeta, Insignia, EncabezadoPagina, EstadoVacio, Esqueleto, Modal, Campo, Entrada, Selector, Interruptor, Alerta, clasesBoton, cx,
} from '@/components/ui';
import {
  IconoMas, IconoBuscar, IconoCopiar, IconoCheck, IconoRenovar, IconoCandadoAbierto, IconoLapiz, IconoBasura, IconoLlave,
  IconoComputadora, IconoWhatsApp, IconoChevron, IconoRenovar as IconoRegenerar,
} from '@/components/iconos';

interface ClienteOpcion { id: number; nombre_empresa: string; telefono: string | null }
interface Evento { id: number; resultado: string; equipo: string | null; version_app: string | null; creado_en: string }

type Filtro = 'todas' | 'atencion' | EstadoLicencia;

const FILTROS: { id: Filtro; texto: string }[] = [
  { id: 'todas', texto: 'Todas' },
  { id: 'atencion', texto: 'Requieren atención' },
  { id: 'activa', texto: 'Activas' },
  { id: 'sin_equipo', texto: 'Sin activar' },
  { id: 'por_vencer', texto: 'Por vencer' },
  { id: 'vencida', texto: 'Vencidas' },
  { id: 'bloqueada', texto: 'Suspendidas' },
];

const TEXTO_EVENTO: Record<string, string> = {
  ACTIVACION: 'Activación en equipo',
  VALIDACION: 'Validación correcta',
  HARDWARE_DISTINTO: 'Rechazada: otra PC',
  LICENCIA_VENCIDA: 'Rechazada: vencida',
  LICENCIA_BLOQUEADA: 'Rechazada: suspendida',
};

export default function LicenciasPage() {
  const { puedeEditar, puedeBorrar } = useSesion();
  const { avisar, confirmar } = useAvisos();

  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [clientes, setClientes] = useState<ClienteOpcion[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const [detalleId, setDetalleId] = useState<number | null>(null);
  const [formulario, setFormulario] = useState<{ modo: 'nueva' | 'editar'; licencia?: Licencia; clienteId?: string } | null>(null);
  const [recienCreada, setRecienCreada] = useState<Licencia | null>(null);

  const cargar = useCallback(async () => {
    const [lic, cli, pln] = await Promise.all([
      supabase.from('licencias').select('*, clientes(nombre_empresa, telefono), planes(nombre, tipo_plan, precio)').order('fecha_emision', { ascending: false }),
      supabase.from('clientes').select('id, nombre_empresa, telefono').order('nombre_empresa'),
      supabase.from('planes').select('*').order('precio'),
    ]);
    if (lic.error) avisar(`No se pudieron leer las licencias: ${lic.error.message}`, 'error');
    setLicencias((lic.data as Licencia[]) ?? []);
    setClientes(cli.data ?? []);
    setPlanes((pln.data as Plan[]) ?? []);
    setCargando(false);
    return (lic.data as Licencia[]) ?? [];
  }, [avisar]);

  // Accesos directos desde otras pantallas: ?nueva=1, ?cliente=ID, ?buscar=CLAVE, ?filtro=atencion
  useEffect(() => {
    // Carga inicial + lectura única de la URL al montar (no hay datos que sincronizar después)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    const p = new URLSearchParams(window.location.search);
    if (p.get('buscar')) setBusqueda(p.get('buscar')!);
    if (p.get('filtro')) setFiltro(p.get('filtro') as Filtro);
    if (p.get('nueva') || p.get('cliente')) setFormulario({ modo: 'nueva', clienteId: p.get('cliente') ?? '' });
    if ([...p.keys()].length) window.history.replaceState(null, '', '/admin/licencias');
  }, [cargar]);

  const conteos = useMemo(() => {
    const c: Record<string, number> = { todas: licencias.length, atencion: 0 };
    licencias.forEach((l) => {
      const e = estadoDe(l);
      c[e] = (c[e] ?? 0) + 1;
      if (e === 'vencida' || e === 'por_vencer') c.atencion += 1;
    });
    return c;
  }, [licencias]);

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    return licencias.filter((l) => {
      const e = estadoDe(l);
      if (filtro === 'atencion' && e !== 'vencida' && e !== 'por_vencer') return false;
      if (filtro !== 'todas' && filtro !== 'atencion' && e !== filtro) return false;
      if (!t) return true;
      return [l.clave_licencia, l.clientes?.nombre_empresa, l.equipo_nombre, l.planes?.nombre].some((v) => v?.toLowerCase().includes(t));
    });
  }, [licencias, busqueda, filtro]);

  const detalle = licencias.find((l) => l.id === detalleId) ?? null;

  // ------------------------------------------------------------ Acciones

  const actualizar = async (id: number, cambios: Record<string, unknown>, exito: string) => {
    const { error } = await supabase.from('licencias').update(cambios).eq('id', id);
    if (error) { avisar(`No se pudo guardar: ${error.message}`, 'error'); return false; }
    avisar(exito);
    await cargar();
    return true;
  };

  const alternarEstado = async (l: Licencia) => {
    if (l.esta_activa) {
      const ok = await confirmar({
        titulo: 'Suspender licencia',
        mensaje: `${l.clientes?.nombre_empresa ?? 'El cliente'} dejará de poder usar FitControl en su próxima validación (al abrir el programa o en máximo 6 horas).`,
        textoConfirmar: 'Suspender',
        peligro: true,
      });
      if (!ok) return;
    }
    await actualizar(l.id, { esta_activa: !l.esta_activa }, l.esta_activa ? 'Licencia suspendida' : 'Licencia reactivada');
  };

  const renovar = async (l: Licencia) => {
    if (!l.planes) return;
    const actual = new Date(l.fecha_expiracion);
    const nueva = calcularExpiracion(l.planes.tipo_plan, actual > new Date() ? actual : new Date());
    const ok = await confirmar({
      titulo: 'Renovar licencia',
      mensaje: `Se sumará un periodo ${NOMBRES_TIPO_PLAN[l.planes.tipo_plan].toLowerCase()} (${formatoDinero(Number(l.planes.precio))}).\n\nNuevo término: ${formatoFecha(nueva.toISOString())}\n\nLa PC del cliente tomará la nueva fecha en su próxima validación.`,
      textoConfirmar: 'Renovar',
    });
    if (ok) await actualizar(l.id, { fecha_expiracion: nueva.toISOString(), esta_activa: true }, `Renovada hasta ${formatoFecha(nueva.toISOString())}`);
  };

  const liberar = async (l: Licencia) => {
    const ok = await confirmar({
      titulo: 'Liberar equipo',
      mensaje: `La PC actual${l.equipo_nombre ? ` (${l.equipo_nombre})` : ''} dejará de validar y la misma llave podrá activarse en otra computadora.\n\nÚsalo cuando el cliente cambie de equipo.`,
      textoConfirmar: 'Liberar equipo',
    });
    if (ok) await actualizar(l.id, { hardware_id: null }, 'Equipo liberado: la llave puede activarse en otra PC');
  };

  const eliminar = async (l: Licencia) => {
    const ok = await confirmar({
      titulo: 'Eliminar licencia',
      mensaje: `Se borrará la llave ${l.clave_licencia} de forma permanente y el cliente perderá el acceso.\n\nSi solo quieres pausarla, mejor usa «Suspender».`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('licencias').delete().eq('id', l.id);
    if (error) { avisar(`No se pudo eliminar: ${error.message}`, 'error'); return; }
    setDetalleId(null);
    avisar('Licencia eliminada');
    cargar();
  };

  // ------------------------------------------------------------ Vista

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Licencias"
        descripcion="Emite llaves, renueva vigencias y controla en qué computadora está activa cada una."
        acciones={puedeEditar && (
          <Boton icono={<IconoMas className="w-4 h-4" />} onClick={() => setFormulario({ modo: 'nueva' })} className="w-full sm:w-auto">
            Emitir licencia
          </Boton>
        )}
      />

      <Tarjeta className="overflow-hidden">
        {/* Buscador + filtros */}
        <div className="p-4 sm:p-5 space-y-4 border-b border-slate-100">
          <div className="relative">
            <IconoBuscar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Entrada
              type="search"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por cliente, llave, equipo o plan"
              className="pl-11"
              aria-label="Buscar licencias"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:flex-wrap pb-1 sm:pb-0" role="tablist" aria-label="Filtrar por estado">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                role="tab"
                aria-selected={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                className={cx(
                  'shrink-0 inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-sm font-medium border transition',
                  filtro === f.id ? 'bg-tinta-900 text-white border-tinta-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300',
                )}
              >
                {f.texto}
                <span className={cx('text-xs tabular-nums', filtro === f.id ? 'text-white/70' : 'text-slate-400')}>{conteos[f.id] ?? 0}</span>
              </button>
            ))}
          </div>
        </div>

        {cargando ? (
          <div className="p-5 space-y-3">{[0, 1, 2, 3].map((i) => <Esqueleto key={i} className="h-16" />)}</div>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            icono={<IconoLlave />}
            titulo={licencias.length === 0 ? 'Aún no hay licencias' : 'Sin resultados'}
            descripcion={licencias.length === 0 ? 'Emite la primera llave para que tu cliente active FitControl.' : 'Prueba con otra búsqueda o cambia el filtro.'}
            accion={licencias.length === 0 && puedeEditar && (
              <Boton icono={<IconoMas className="w-4 h-4" />} onClick={() => setFormulario({ modo: 'nueva' })}>Emitir licencia</Boton>
            )}
          />
        ) : (
          <>
            {/* Tabla: tabletas grandes y escritorio */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs font-medium text-slate-500 bg-slate-50/70">
                    <th className="px-5 py-3 font-medium">Cliente</th>
                    <th className="px-5 py-3 font-medium">Llave</th>
                    <th className="px-5 py-3 font-medium">Equipo</th>
                    <th className="px-5 py-3 font-medium">Vigencia</th>
                    <th className="px-5 py-3 font-medium">Estado</th>
                    <th className="px-5 py-3"><span className="sr-only">Ver</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {visibles.map((l) => {
                    const est = PRESENTACION_ESTADO[estadoDe(l)];
                    return (
                      <tr key={l.id} onClick={() => setDetalleId(l.id)} className="cursor-pointer hover:bg-slate-50 transition">
                        <td className="px-5 py-4">
                          <p className="font-medium text-tinta-900">{l.clientes?.nombre_empresa ?? 'Cliente eliminado'}</p>
                          <p className="text-xs text-slate-500">{l.planes?.nombre ?? '—'}</p>
                        </td>
                        <td className="px-5 py-4"><ClaveCopiable clave={l.clave_licencia} /></td>
                        <td className="px-5 py-4">
                          {l.hardware_id ? (
                            <>
                              <p className="text-tinta-900 truncate max-w-44">{l.equipo_nombre ?? 'PC vinculada'}</p>
                              <p className="text-xs text-slate-500">{haceCuanto(l.ultima_validacion) ?? 'sin reporte'}</p>
                            </>
                          ) : <span className="text-slate-400">Esperando activación</span>}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <p className="text-tinta-900">{formatoFecha(l.fecha_expiracion)}</p>
                          <p className="text-xs text-slate-500">{textoDias(l.fecha_expiracion)}</p>
                        </td>
                        <td className="px-5 py-4"><Insignia tono={est.tono} punto>{est.texto}</Insignia></td>
                        <td className="px-5 py-4 text-right"><IconoChevron className="w-4 h-4 text-slate-300 inline" /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Tarjetas: celulares y tabletas chicas */}
            <ul className="md:hidden divide-y divide-slate-100">
              {visibles.map((l) => {
                const est = PRESENTACION_ESTADO[estadoDe(l)];
                return (
                  <li key={l.id}>
                    <button type="button" onClick={() => setDetalleId(l.id)} className="w-full text-left px-4 py-4 active:bg-slate-50">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="font-medium text-tinta-900 truncate">{l.clientes?.nombre_empresa ?? 'Cliente eliminado'}</p>
                          <p className="text-xs text-slate-500">{l.planes?.nombre ?? '—'}</p>
                        </div>
                        <Insignia tono={est.tono} punto>{est.texto}</Insignia>
                      </div>
                      <p className="mt-2 font-mono text-xs text-slate-600">{l.clave_licencia}</p>
                      <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                        <span>Vence {formatoFecha(l.fecha_expiracion)}</span>
                        <span className="truncate pl-2">{l.hardware_id ? (l.equipo_nombre ?? 'PC vinculada') : 'Sin activar'}</span>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Tarjeta>

      {/* ------------------------------------------------ Detalle */}
      <PanelDetalle
        key={detalleId ?? 'ninguna'}
        licencia={detalle}
        onCerrar={() => setDetalleId(null)}
        puedeEditar={puedeEditar}
        puedeBorrar={puedeBorrar}
        onRenovar={renovar}
        onAlternar={alternarEstado}
        onLiberar={liberar}
        onEditar={(l) => setFormulario({ modo: 'editar', licencia: l })}
        onEliminar={eliminar}
      />

      {/* ------------------------------------------------ Alta / edición */}
      {formulario && (
        <FormularioLicencia
          key={formulario.licencia?.id ?? 'nueva'}
          modo={formulario.modo}
          licencia={formulario.licencia}
          clienteInicial={formulario.clienteId}
          clientes={clientes}
          planes={planes}
          onCerrar={() => setFormulario(null)}
          onGuardado={async (id) => {
            setFormulario(null);
            const lista = await cargar();
            if (formulario.modo === 'nueva') setRecienCreada(lista.find((x) => x.id === id) ?? null);
            else avisar('Cambios guardados');
          }}
        />
      )}

      {/* ------------------------------------------------ Licencia lista para entregar */}
      <ModalEntrega licencia={recienCreada} onCerrar={() => setRecienCreada(null)} />
    </div>
  );
}

function textoDias(iso: string) {
  const d = diasRestantes(iso);
  if (d < 0) return `venció hace ${-d} días`;
  if (d === 0) return 'vence hoy';
  if (d > 3650) return 'permanente';
  return `quedan ${d} días`;
}

function ClaveCopiable({ clave, grande }: { clave: string; grande?: boolean }) {
  const [copiada, setCopiada] = useState(false);
  const copiar = async (e: React.MouseEvent) => {
    e.stopPropagation(); // no abrir el detalle al copiar desde la tabla
    try {
      await navigator.clipboard.writeText(clave);
      setCopiada(true);
      setTimeout(() => setCopiada(false), 1500);
    } catch { /* el navegador no permitió el portapapeles */ }
  };
  return (
    <span className={cx('inline-flex items-center gap-2 rounded-lg bg-slate-100 font-mono font-semibold text-tinta-900', grande ? 'px-3 py-2 text-sm' : 'pl-2.5 pr-1 py-1 text-xs')}>
      <span className="select-all">{clave}</span>
      <button type="button" onClick={copiar} aria-label="Copiar llave" title="Copiar llave" className="p-1 rounded-md text-slate-400 hover:text-tinta-900 hover:bg-white transition">
        {copiada ? <IconoCheck className="w-4 h-4 text-emerald-600" /> : <IconoCopiar className="w-4 h-4" />}
      </button>
    </span>
  );
}

// ==================================================================== Detalle

function PanelDetalle({ licencia: l, onCerrar, puedeEditar, puedeBorrar, onRenovar, onAlternar, onLiberar, onEditar, onEliminar }: {
  licencia: Licencia | null;
  onCerrar: () => void;
  puedeEditar: boolean;
  puedeBorrar: boolean;
  onRenovar: (l: Licencia) => void;
  onAlternar: (l: Licencia) => void;
  onLiberar: (l: Licencia) => void;
  onEditar: (l: Licencia) => void;
  onEliminar: (l: Licencia) => void;
}) {
  const [eventos, setEventos] = useState<Evento[] | null>(null);

  // El panel se monta de nuevo por cada licencia (key), así que el historial arranca vacío
  const licenciaId = l?.id;
  useEffect(() => {
    if (!licenciaId) return;
    supabase
      .from('licencia_eventos')
      .select('id, resultado, equipo, version_app, creado_en')
      .eq('licencia_id', licenciaId)
      .order('creado_en', { ascending: false })
      .limit(10)
      .then(({ data, error }) => setEventos(error ? [] : (data as Evento[])));
  }, [licenciaId]);

  if (!l) return <Modal abierto={false} onCerrar={onCerrar} titulo="">{null}</Modal>;
  const est = PRESENTACION_ESTADO[estadoDe(l)];

  return (
    <Modal abierto onCerrar={onCerrar} variante="panel" titulo={l.clientes?.nombre_empresa ?? 'Licencia'} descripcion={l.planes?.nombre}>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-3">
          <Insignia tono={est.tono} punto>{est.texto}</Insignia>
          <span className="text-sm text-slate-500">{textoDias(l.fecha_expiracion)}</span>
        </div>

        <ClaveCopiable clave={l.clave_licencia} grande />

        <dl className="grid grid-cols-2 gap-4 text-sm">
          <Dato titulo="Emitida">{formatoFecha(l.fecha_emision)}</Dato>
          <Dato titulo="Vence">{formatoFecha(l.fecha_expiracion)}</Dato>
          <Dato titulo="Equipo">{l.hardware_id ? (l.equipo_nombre ?? 'PC vinculada') : 'Sin activar'}</Dato>
          <Dato titulo="Última conexión">{haceCuanto(l.ultima_validacion) ?? '—'}</Dato>
          <Dato titulo="Versión del programa">{l.version_app ? `v${l.version_app}` : '—'}</Dato>
          <Dato titulo="Precio del plan">{l.planes ? formatoDinero(Number(l.planes.precio)) : '—'}</Dato>
          {l.hardware_id && (
            <div className="col-span-2">
              <dt className="text-xs text-slate-500">Identificador del equipo</dt>
              <dd className="mt-0.5 font-mono text-xs text-tinta-900 break-all">{l.hardware_id}</dd>
            </div>
          )}
        </dl>

        {puedeEditar && (
          <div className="grid grid-cols-2 gap-2">
            <Boton variante="primario" icono={<IconoRenovar className="w-4 h-4" />} onClick={() => onRenovar(l)} className="col-span-2">
              Renovar un periodo
            </Boton>
            <Boton variante="secundario" icono={<IconoLapiz className="w-4 h-4" />} onClick={() => onEditar(l)}>Editar</Boton>
            <Boton variante="secundario" onClick={() => onAlternar(l)}>{l.esta_activa ? 'Suspender' : 'Reactivar'}</Boton>
            {l.hardware_id && (
              <Boton variante="secundario" icono={<IconoCandadoAbierto className="w-4 h-4" />} onClick={() => onLiberar(l)} className="col-span-2">
                Liberar equipo (cambio de PC)
              </Boton>
            )}
            <a
              href={enlaceWhatsApp(l.clientes?.telefono, mensajeEntregaLicencia(l.clientes?.nombre_empresa ?? '', l.clave_licencia, formatoFecha(l.fecha_expiracion)))}
              target="_blank"
              rel="noopener noreferrer"
              className={clasesBoton('secundario', 'md', 'col-span-2 text-emerald-700')}
            >
              <IconoWhatsApp className="w-4 h-4" /> Enviar llave por WhatsApp
            </a>
          </div>
        )}

        <div>
          <h3 className="text-sm font-semibold text-tinta-900 mb-3">Historial de conexiones</h3>
          {eventos === null ? (
            <div className="space-y-2"><Esqueleto className="h-10" /><Esqueleto className="h-10" /></div>
          ) : eventos.length === 0 ? (
            <p className="text-sm text-slate-500">Sin registros todavía.</p>
          ) : (
            <ol className="space-y-3">
              {eventos.map((e) => (
                <li key={e.id} className="flex items-start gap-3 text-sm">
                  <IconoComputadora className="w-4 h-4 mt-0.5 text-slate-400 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-tinta-900">{TEXTO_EVENTO[e.resultado] ?? e.resultado}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {new Date(e.creado_en).toLocaleString('es-MX', { dateStyle: 'medium', timeStyle: 'short' })}
                      {e.equipo && ` · ${e.equipo}`}{e.version_app && ` · v${e.version_app}`}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>

        {puedeBorrar && (
          <div className="pt-4 border-t border-slate-100">
            <button type="button" onClick={() => onEliminar(l)} className="inline-flex items-center gap-2 text-sm font-medium text-rose-600 hover:text-rose-700">
              <IconoBasura className="w-4 h-4" /> Eliminar licencia
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}

function Dato({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-slate-500">{titulo}</dt>
      <dd className="mt-0.5 font-medium text-tinta-900">{children}</dd>
    </div>
  );
}

// ==================================================================== Formulario

function FormularioLicencia({ modo, licencia, clienteInicial, clientes, planes, onCerrar, onGuardado }: {
  modo: 'nueva' | 'editar';
  licencia?: Licencia;
  clienteInicial?: string;
  clientes: ClienteOpcion[];
  planes: Plan[];
  onCerrar: () => void;
  onGuardado: (id: number) => void;
}) {
  const esNueva = modo === 'nueva';
  const [clienteId, setClienteId] = useState(licencia ? String(licencia.cliente_id) : clienteInicial ?? '');
  const [planId, setPlanId] = useState(licencia ? String(licencia.plan_id) : '');
  const [clave, setClave] = useState(licencia?.clave_licencia ?? generarSerial());
  const [fecha, setFecha] = useState(licencia ? aInputFecha(licencia.fecha_expiracion) : '');
  const [hardwareId, setHardwareId] = useState(licencia?.hardware_id ?? '');
  const [activa, setActiva] = useState(licencia?.esta_activa ?? true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  // Al editar se muestran también los planes ocultos (por si la licencia usa uno retirado)
  const opcionesPlan = esNueva ? planes.filter((p) => p.esta_disponible) : planes;
  const planElegido = planes.find((p) => p.id === Number(planId));
  const venceraEl = esNueva && planElegido ? formatoFecha(calcularExpiracion(planElegido.tipo_plan, new Date()).toISOString()) : null;

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');

    const res = esNueva
      ? await supabase.from('licencias').insert({
          cliente_id: Number(clienteId),
          plan_id: Number(planId),
          clave_licencia: clave,
          fecha_expiracion: calcularExpiracion(planElegido!.tipo_plan, new Date()).toISOString(),
          esta_activa: true,
          hardware_id: null,
        }).select('id').single()
      // Al editar se RESPETA la fecha de término: cambiar el plan no la recalcula
      : await supabase.from('licencias').update({
          cliente_id: Number(clienteId),
          plan_id: Number(planId),
          fecha_expiracion: new Date(`${fecha}T23:59:59`).toISOString(),
          hardware_id: hardwareId.trim() || null,
          esta_activa: activa,
        }).eq('id', licencia!.id).select('id').single();

    setGuardando(false);
    if (res.error) { setError(res.error.message); return; }
    onGuardado(res.data.id);
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={esNueva ? 'Emitir licencia' : 'Editar licencia'}
      descripcion={esNueva ? 'La vigencia se calcula desde hoy según el plan.' : licencia?.clave_licencia}
      pie={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} className="w-full sm:w-auto">Cancelar</Boton>
          <Boton type="submit" form="form-licencia" cargando={guardando} disabled={!clienteId || !planId} className="w-full sm:w-auto">
            {esNueva ? 'Emitir licencia' : 'Guardar cambios'}
          </Boton>
        </div>
      }
    >
      <form id="form-licencia" onSubmit={guardar} className="space-y-5">
        {error && <Alerta>{error}</Alerta>}

        <Campo etiqueta="Cliente" ayuda={clientes.length === 0 ? 'Primero registra un cliente en la sección Clientes.' : undefined}>
          {(id) => (
            <Selector id={id} required value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
              <option value="">Selecciona un cliente…</option>
              {clientes.map((c) => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
            </Selector>
          )}
        </Campo>

        <Campo etiqueta="Plan" ayuda={venceraEl ? `Vigente hasta el ${venceraEl}` : undefined}>
          {(id) => (
            <Selector id={id} required value={planId} onChange={(e) => setPlanId(e.target.value)}>
              <option value="">Selecciona un plan…</option>
              {opcionesPlan.map((p) => (
                <option key={p.id} value={p.id}>{p.nombre} · {formatoDinero(Number(p.precio))} ({NOMBRES_TIPO_PLAN[p.tipo_plan]})</option>
              ))}
            </Selector>
          )}
        </Campo>

        {esNueva ? (
          <Campo etiqueta="Llave de activación" ayuda="Se genera automáticamente; puedes regenerarla antes de emitir.">
            {(id) => (
              <div className="flex gap-2">
                <Entrada id={id} readOnly value={clave} className="font-mono font-semibold text-center tracking-wider bg-slate-50" />
                <BotonIcono etiqueta="Generar otra llave" onClick={() => setClave(generarSerial())} className="w-11 h-11 shrink-0">
                  <IconoRegenerar className="w-5 h-5" />
                </BotonIcono>
              </div>
            )}
          </Campo>
        ) : (
          <>
            <Campo etiqueta="Fecha de término" ayuda="Cambiar el plan no modifica esta fecha. Para sumar un periodo usa «Renovar».">
              {(id) => <Entrada id={id} type="date" required value={fecha} onChange={(e) => setFecha(e.target.value)} />}
            </Campo>
            <Campo etiqueta="Identificador del equipo" ayuda="Déjalo vacío para permitir activar en otra PC.">
              {(id) => <Entrada id={id} value={hardwareId} onChange={(e) => setHardwareId(e.target.value)} placeholder="Sin equipo vinculado" className="font-mono text-xs" />}
            </Campo>
            <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
              <div>
                <p className="text-sm font-medium text-tinta-900">Licencia activa</p>
                <p className="text-xs text-slate-500">Si la desactivas, el programa se bloquea en su próxima validación.</p>
              </div>
              <Interruptor activo={activa} onCambio={() => setActiva(!activa)} etiqueta="Licencia activa" />
            </div>
          </>
        )}
      </form>
    </Modal>
  );
}

// ==================================================================== Entrega

function ModalEntrega({ licencia: l, onCerrar }: { licencia: Licencia | null; onCerrar: () => void }) {
  const [copiado, setCopiado] = useState(false);
  if (!l) return null;
  const mensaje = mensajeEntregaLicencia(l.clientes?.nombre_empresa ?? '', l.clave_licencia, formatoFecha(l.fecha_expiracion));

  const copiarMensaje = async () => {
    try { await navigator.clipboard.writeText(mensaje); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* sin portapapeles */ }
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo="¡Licencia lista!"
      descripcion={`Para ${l.clientes?.nombre_empresa ?? 'tu cliente'} · vence el ${formatoFecha(l.fecha_expiracion)}`}
      pie={<Boton variante="secundario" onClick={onCerrar} className="w-full sm:w-auto sm:ml-auto sm:flex">Listo</Boton>}
    >
      <div className="space-y-5">
        <div className="flex justify-center"><ClaveCopiable clave={l.clave_licencia} grande /></div>
        <p className="text-sm text-slate-600 text-center">Envía al cliente el instalador y esta llave. La activará la primera vez que abra FitControl.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <a href={enlaceWhatsApp(l.clientes?.telefono, mensaje)} target="_blank" rel="noopener noreferrer" className={clasesBoton('primario', 'md', 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20')}>
            <IconoWhatsApp className="w-4 h-4" /> Enviar por WhatsApp
          </a>
          <Boton variante="secundario" icono={copiado ? <IconoCheck className="w-4 h-4" /> : <IconoCopiar className="w-4 h-4" />} onClick={copiarMensaje}>
            {copiado ? 'Mensaje copiado' : 'Copiar mensaje'}
          </Boton>
        </div>
        {!l.clientes?.telefono && <p className="text-xs text-slate-500 text-center">Este cliente no tiene teléfono registrado; WhatsApp te pedirá elegir el contacto.</p>}
      </div>
    </Modal>
  );
}
