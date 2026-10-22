'use client';

import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import {
  type Licencia, diasRestantes, estadoDe, PRESENTACION_ESTADO, ingresoMensual, formatoDinero, formatoFecha, haceCuanto, sinReportarDesde,
} from '@/lib/licencias';
import { Tarjeta, Insignia, Esqueleto, EstadoVacio, EncabezadoPagina, clasesBoton, cx } from '@/components/ui';
import {
  IconoEdificio, IconoLlave, IconoAlerta, IconoDinero, IconoMas, IconoWifiOff, IconoChevron, IconoReloj, IconoCheck,
} from '@/components/iconos';

interface Evento {
  id: number;
  resultado: string;
  equipo: string | null;
  creado_en: string;
  clave: string | null;
}

const TEXTO_EVENTO: Record<string, { texto: string; tono: 'verde' | 'rojo' | 'ambar' | 'gris' | 'azul' }> = {
  ACTIVACION: { texto: 'Activó en un equipo', tono: 'azul' },
  VALIDACION: { texto: 'Validó su licencia', tono: 'verde' },
  HARDWARE_DISTINTO: { texto: 'Intento desde otra PC', tono: 'rojo' },
  LICENCIA_VENCIDA: { texto: 'Intento con licencia vencida', tono: 'ambar' },
  LICENCIA_BLOQUEADA: { texto: 'Intento con licencia suspendida', tono: 'gris' },
};

const DIAS_SIN_CONEXION_ALERTA = 7;

export default function ResumenPage() {
  const { email } = useSesion();
  const [cargando, setCargando] = useState(true);
  const [totalClientes, setTotalClientes] = useState(0);
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [eventos, setEventos] = useState<Evento[] | null>(null);

  useEffect(() => {
    async function cargar() {
      const [cli, lic, evt] = await Promise.all([
        supabase.from('clientes').select('id', { count: 'exact', head: true }),
        supabase.from('licencias').select('*, clientes(nombre_empresa, telefono), planes(nombre, tipo_plan, precio)'),
        supabase.from('licencia_eventos').select('id, resultado, equipo, creado_en, clave').order('creado_en', { ascending: false }).limit(8),
      ]);
      setTotalClientes(cli.count ?? 0);
      setLicencias((lic.data as Licencia[]) ?? []);
      // Si aún no se ejecuta el SQL de telemetría, la tarjeta de actividad simplemente no se muestra
      setEventos(evt.error ? null : (evt.data as Evento[]));
      setCargando(false);
    }
    cargar();
  }, []);

  const vigentes = licencias.filter((l) => l.esta_activa && diasRestantes(l.fecha_expiracion) >= 0);
  const mrr = vigentes.reduce((s, l) => s + (l.planes ? ingresoMensual(l.planes.tipo_plan, Number(l.planes.precio) || 0) : 0), 0);

  const atencion = licencias
    .filter((l) => ['vencida', 'por_vencer'].includes(estadoDe(l)))
    .sort((a, b) => diasRestantes(a.fecha_expiracion) - diasRestantes(b.fecha_expiracion));

  const sinConexion = vigentes.filter((l) => l.hardware_id && sinReportarDesde(l.ultima_validacion, DIAS_SIN_CONEXION_ALERTA));

  const porPlan = Object.values(
    vigentes.reduce<Record<string, { nombre: string; total: number }>>((acc, l) => {
      const nombre = l.planes?.nombre ?? 'Sin plan';
      acc[nombre] = acc[nombre] ?? { nombre, total: 0 };
      acc[nombre].total += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.total - a.total);

  const saludo = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  })();

  return (
    <div className="space-y-6 sm:space-y-8">
      <EncabezadoPagina
        titulo={`${saludo}${email ? `, ${email.split('@')[0]}` : ''}`}
        descripcion="Así va tu cartera de centros de entrenamiento hoy."
        acciones={
          <Link href="/admin/licencias?nueva=1" className={clasesBoton('primario', 'md', 'w-full sm:w-auto')}>
            <IconoMas className="w-4 h-4" /> Emitir licencia
          </Link>
        }
      />

      {/* ------------------------------------------------ Métricas */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <Metrica cargando={cargando} etiqueta="Clientes" valor={totalClientes} icono={<IconoEdificio />} href="/admin/clientes" />
        <Metrica cargando={cargando} etiqueta="Licencias vigentes" valor={vigentes.length} icono={<IconoLlave />} href="/admin/licencias" />
        <Metrica
          cargando={cargando}
          etiqueta="Requieren atención"
          valor={atencion.length}
          icono={<IconoAlerta />}
          resaltar={atencion.length > 0}
          href="/admin/licencias?filtro=atencion"
        />
        <Metrica cargando={cargando} etiqueta="Ingreso recurrente / mes" valor={formatoDinero(mrr)} icono={<IconoDinero />} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* ------------------------------------------------ Requieren atención */}
        <Tarjeta className="xl:col-span-2 overflow-hidden">
          <EncabezadoTarjeta titulo="Vencimientos" descripcion="Vencidas o que vencen en los próximos 15 días" />
          {cargando ? (
            <ListaEsqueleto />
          ) : atencion.length === 0 ? (
            <EstadoVacio icono={<IconoCheck />} titulo="Todo en orden" descripcion="Ninguna licencia vence en los próximos 15 días." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {atencion.slice(0, 6).map((l) => {
                const dias = diasRestantes(l.fecha_expiracion);
                const est = PRESENTACION_ESTADO[estadoDe(l)];
                return (
                  <li key={l.id}>
                    <Link href={`/admin/licencias?buscar=${encodeURIComponent(l.clave_licencia)}`} className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50 transition">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium text-tinta-900">{l.clientes?.nombre_empresa ?? 'Cliente eliminado'}</p>
                        <p className="text-xs text-slate-500">{l.planes?.nombre ?? '—'} · {formatoFecha(l.fecha_expiracion)}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <Insignia tono={est.tono}>{dias < 0 ? `Venció hace ${-dias} d` : dias === 0 ? 'Vence hoy' : `${dias} días`}</Insignia>
                      </div>
                      <IconoChevron className="w-4 h-4 text-slate-300 shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Tarjeta>

        {/* ------------------------------------------------ Distribución por plan */}
        <Tarjeta className="overflow-hidden">
          <EncabezadoTarjeta titulo="Licencias por plan" descripcion="Solo vigentes" />
          <div className="p-5 space-y-4">
            {cargando ? (
              <>
                <Esqueleto className="h-8" /><Esqueleto className="h-8" /><Esqueleto className="h-8" />
              </>
            ) : porPlan.length === 0 ? (
              <p className="text-sm text-slate-500">Aún no hay licencias vigentes.</p>
            ) : (
              porPlan.map((p) => {
                const pct = Math.round((p.total / vigentes.length) * 100);
                return (
                  <div key={p.nombre}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-tinta-900 truncate pr-2">{p.nombre}</span>
                      <span className="text-slate-500 tabular-nums">{p.total} · {pct}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full bg-marca-500" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Tarjeta>

        {/* ------------------------------------------------ Sin conexión */}
        <Tarjeta className="xl:col-span-2 overflow-hidden">
          <EncabezadoTarjeta
            titulo="Equipos sin conexión"
            descripcion={`Licencias vigentes que no validan hace más de ${DIAS_SIN_CONEXION_ALERTA} días`}
          />
          {cargando ? (
            <ListaEsqueleto />
          ) : sinConexion.length === 0 ? (
            <EstadoVacio icono={<IconoCheck />} titulo="Todos los equipos se reportan" descripcion="Cada PC activa ha validado su licencia recientemente." />
          ) : (
            <ul className="divide-y divide-slate-100">
              {sinConexion.slice(0, 6).map((l) => (
                <li key={l.id} className="flex items-center gap-4 px-5 py-3.5">
                  <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0"><IconoWifiOff className="w-5 h-5" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-tinta-900">{l.clientes?.nombre_empresa ?? '—'}</p>
                    <p className="text-xs text-slate-500 truncate">{l.equipo_nombre ?? 'PC'} · {haceCuanto(l.ultima_validacion) ?? 'nunca ha validado con la versión nueva'}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Tarjeta>

        {/* ------------------------------------------------ Actividad reciente */}
        {eventos !== null && (
          <Tarjeta className="overflow-hidden">
            <EncabezadoTarjeta titulo="Actividad reciente" descripcion="Activaciones y validaciones de las PC" />
            {eventos.length === 0 ? (
              <EstadoVacio icono={<IconoReloj />} titulo="Sin actividad todavía" />
            ) : (
              <ol className="p-5 space-y-4">
                {eventos.map((e) => {
                  const info = TEXTO_EVENTO[e.resultado] ?? { texto: e.resultado, tono: 'gris' as const };
                  return (
                    <li key={e.id} className="flex gap-3">
                      <span className={cx('mt-1.5 w-2 h-2 rounded-full shrink-0', {
                        verde: 'bg-emerald-500', rojo: 'bg-rose-500', ambar: 'bg-amber-500', gris: 'bg-slate-400', azul: 'bg-sky-500',
                      }[info.tono])} />
                      <div className="min-w-0">
                        <p className="text-sm text-tinta-900">{info.texto}</p>
                        <p className="text-xs text-slate-500 truncate">{e.equipo ?? 'PC'} · {haceCuanto(e.creado_en)}</p>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </Tarjeta>
        )}
      </div>
    </div>
  );
}

function Metrica({ etiqueta, valor, icono, cargando, resaltar, href }: {
  etiqueta: string; valor: ReactNode; icono: ReactNode; cargando: boolean; resaltar?: boolean; href?: string;
}) {
  const contenido = (
    <Tarjeta className={cx('p-4 sm:p-5 h-full transition', href && 'hover:border-slate-300 hover:shadow-sm', resaltar && 'border-amber-200 bg-amber-50/40')}>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-medium text-slate-500 leading-snug">{etiqueta}</p>
        <span className={cx('w-9 h-9 rounded-xl flex items-center justify-center shrink-0 [&>svg]:w-5 [&>svg]:h-5', resaltar ? 'bg-amber-100 text-amber-600' : 'bg-marca-50 text-marca-600')}>
          {icono}
        </span>
      </div>
      {cargando ? <Esqueleto className="h-8 w-20 mt-3" /> : <p className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-tinta-900 tabular-nums">{valor}</p>}
    </Tarjeta>
  );
  return href ? <Link href={href} className="block">{contenido}</Link> : contenido;
}

function EncabezadoTarjeta({ titulo, descripcion }: { titulo: string; descripcion?: string }) {
  return (
    <div className="px-5 pt-5 pb-3">
      <h2 className="font-semibold text-tinta-900">{titulo}</h2>
      {descripcion && <p className="text-xs text-slate-500 mt-0.5">{descripcion}</p>}
    </div>
  );
}

function ListaEsqueleto() {
  return (
    <div className="px-5 pb-5 space-y-3">
      {[0, 1, 2].map((i) => <Esqueleto key={i} className="h-12" />)}
    </div>
  );
}
