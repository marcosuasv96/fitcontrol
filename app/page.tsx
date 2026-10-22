'use client';

import { useState, useEffect, type ComponentType } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { type Plan, NOMBRES_TIPO_PLAN, SUFIJO_PRECIO, MODULOS_BASE, MODULOS_PREMIUM, formatoDinero, textoActualizaciones } from '@/lib/licencias';
import { clasesBoton, cx } from '@/components/ui';
import {
  IconoUsuarios, IconoCredencial, IconoCaja, IconoCarrito, IconoGrafica, IconoEscudo, IconoWifiOff, IconoComputadora,
  IconoCheck, IconoMenu, IconoCerrar, IconoWhatsApp, IconoChevron, IconoDescarga, IconoLlave, IconoReloj,
} from '@/components/iconos';

const WHATSAPP = '523316919113';
const enlaceWA = (texto: string) => `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
const MENSAJE_GENERAL = 'Hola, me interesa recibir más información sobre el sistema FitControl.';

const NAV = [
  { href: '#funciones', texto: 'Funciones' },
  { href: '#como-empezar', texto: 'Cómo empezar' },
  { href: '#precios', texto: 'Precios' },
  { href: '#preguntas', texto: 'Preguntas' },
];

const FUNCIONES: { Icono: ComponentType<{ className?: string }>; titulo: string; texto: string }[] = [
  { Icono: IconoUsuarios, titulo: 'Socios y membresías', texto: 'Expediente con foto, historial de pagos, renovaciones y avisos de cumpleaños.' },
  { Icono: IconoCredencial, titulo: 'Credenciales con código de barras', texto: 'Imprime credenciales con tu logo en 3 plantillas: clásica, horizontal o deportiva.' },
  { Icono: IconoReloj, titulo: 'Control de acceso', texto: 'Check-in en segundos: muestra foto, días restantes y bloquea membresías vencidas.' },
  { Icono: IconoCaja, titulo: 'Caja por turnos', texto: 'Cada empleado abre y cierra su propio corte con gastos y efectivo esperado.' },
  { Icono: IconoCarrito, titulo: 'Punto de venta', texto: 'Vende suplementos y bebidas con lector de código de barras e imprime ticket.' },
  { Icono: IconoGrafica, titulo: 'Inventario y reportes', texto: 'Kardex de entradas y salidas, alerta de stock bajo y reporte de cada corte.' },
  { Icono: IconoEscudo, titulo: 'Roles y permisos', texto: 'Define qué puede ver, crear, editar o eliminar cada empleado en cada módulo.' },
  { Icono: IconoWifiOff, titulo: 'Funciona sin internet', texto: 'Tus datos viven en tu computadora. El internet solo se usa para validar la licencia.' },
];

const PASOS = [
  { Icono: IconoWhatsApp, titulo: 'Elige tu plan', texto: 'Escríbenos por WhatsApp y elige el plan que mejor se adapte a tu negocio.' },
  { Icono: IconoDescarga, titulo: 'Recibe el instalador y tu llave', texto: 'Te enviamos el programa para Windows y una llave de activación única.' },
  { Icono: IconoLlave, titulo: 'Activa y empieza', texto: 'Instala, pega tu llave y listo: registra socios y cobra desde el primer día.' },
];

const PREGUNTAS = [
  { p: '¿Qué pasa si mi centro se queda sin internet?', r: 'Nada: FitControl trabaja con una base de datos en tu propia computadora y sigue operando al 100 %. Solo necesita conectarse de vez en cuando para validar la licencia (hasta 30 días sin internet).' },
  { p: '¿Puedo usar mi licencia en varias computadoras?', r: 'Cada licencia se vincula a una sola computadora para evitar copias no autorizadas. Si necesitas más equipos, contrata una licencia adicional.' },
  { p: '¿Qué pasa si cambio de computadora?', r: 'Escríbenos y liberamos tu licencia para que la actives en el equipo nuevo con la misma llave.' },
  { p: '¿Dónde se guardan los datos de mis socios?', r: 'En tu computadora, no en la nube. Tú tienes el control de tu información; te recomendamos hacer respaldos periódicos.' },
  { p: '¿Qué necesito para instalarlo?', r: 'Una computadora con Windows 10 u 11 y SQL Server Express (gratuito; te ayudamos a instalarlo). Para credenciales y tickets, cualquier impresora; para el check-in rápido, un lector de código de barras USB (opcional).' },
];

export default function LandingPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [cargando, setCargando] = useState(true);
  const [menuAbierto, setMenuAbierto] = useState(false);

  useEffect(() => {
    supabase
      .from('planes')
      .select('*')
      .eq('esta_disponible', true)
      .order('precio', { ascending: true })
      .then(({ data }) => { setPlanes((data as Plan[]) ?? []); setCargando(false); });
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuAbierto ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuAbierto]);

  // El plan anual se destaca como recomendado; si no hay, el del medio
  const destacado = planes.find((p) => p.tipo_plan === 'anual')?.id ?? planes[Math.floor(planes.length / 2)]?.id;

  return (
    <div className="bg-white text-slate-900 overflow-x-hidden">
      {/* ================================================= Navegación */}
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur border-b border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="FitControl" width={34} height={34} className="rounded-lg" />
            <span className="text-lg font-bold tracking-wide text-tinta-900">FIT<span className="text-marca-500">CONTROL</span></span>
          </a>

          <nav className="hidden md:flex items-center gap-8" aria-label="Secciones">
            {NAV.map((n) => <a key={n.href} href={n.href} className="text-sm font-medium text-slate-600 hover:text-tinta-900 transition">{n.texto}</a>)}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-tinta-900">Acceso</Link>
            <a href={enlaceWA(MENSAJE_GENERAL)} target="_blank" rel="noopener noreferrer" className={clasesBoton('oscuro', 'md')}>Cotizar</a>
          </div>

          <button type="button" onClick={() => setMenuAbierto(true)} className="md:hidden p-2 -mr-2 rounded-lg text-tinta-900" aria-label="Abrir menú">
            <IconoMenu className="w-6 h-6" />
          </button>
        </div>
      </header>

      {/* Menú móvil a pantalla completa */}
      {menuAbierto && (
        <div className="fixed inset-0 z-50 bg-white flex flex-col md:hidden animate-aparecer">
          <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
            <span className="text-lg font-bold tracking-wide text-tinta-900">FIT<span className="text-marca-500">CONTROL</span></span>
            <button type="button" onClick={() => setMenuAbierto(false)} className="p-2 -mr-2" aria-label="Cerrar menú"><IconoCerrar className="w-6 h-6" /></button>
          </div>
          <nav className="flex-1 px-4 py-6 flex flex-col" aria-label="Secciones">
            {NAV.map((n) => (
              <a key={n.href} href={n.href} onClick={() => setMenuAbierto(false)} className="flex items-center justify-between py-4 text-lg font-semibold text-tinta-900 border-b border-slate-100">
                {n.texto} <IconoChevron className="w-5 h-5 text-slate-300" />
              </a>
            ))}
            <Link href="/login" onClick={() => setMenuAbierto(false)} className="py-4 text-lg font-semibold text-slate-500">Acceso administradores</Link>
          </nav>
          <div className="p-4 border-t border-slate-100 pb-seguro">
            <a href={enlaceWA(MENSAJE_GENERAL)} target="_blank" rel="noopener noreferrer" className={clasesBoton('primario', 'lg', 'w-full')}>
              <IconoWhatsApp className="w-5 h-5" /> Cotizar por WhatsApp
            </a>
          </div>
        </div>
      )}

      {/* ================================================= Hero */}
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[620px] bg-gradient-to-b from-marca-50 via-white to-white -z-10" />
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-12 sm:pt-20 pb-16 sm:pb-24 grid lg:grid-cols-12 gap-12 items-center">
          <div className="lg:col-span-6 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-marca-700 ring-1 ring-marca-200">
              <IconoComputadora className="w-4 h-4" /> Programa para Windows · funciona sin internet
            </span>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-tinta-900 leading-[1.05]">
              Administra tu centro de entrenamiento <span className="text-marca-500">sin complicaciones</span>
            </h1>
            <p className="text-lg text-slate-600 max-w-xl">
              Para gimnasios, boxes, estudios, academias y cualquier centro fitness. Socios, accesos, caja, punto de venta e inventario en un solo programa. Cada peso registrado y cada empleado con sus propios permisos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a href="#precios" className={clasesBoton('primario', 'lg')}>Ver precios</a>
              <a href={enlaceWA(MENSAJE_GENERAL)} target="_blank" rel="noopener noreferrer" className={clasesBoton('secundario', 'lg')}>
                <IconoWhatsApp className="w-5 h-5 text-emerald-600" /> Hablar con un asesor
              </a>
            </div>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-600">
              {['Instalación guiada', 'Tus datos en tu PC', 'Soporte por WhatsApp'].map((t) => (
                <li key={t} className="flex items-center gap-1.5"><IconoCheck className="w-4 h-4 text-emerald-600" /> {t}</li>
              ))}
            </ul>
          </div>

          <div className="lg:col-span-6">
            <MaquetaApp />
          </div>
        </div>
      </section>

      {/* ================================================= Funciones */}
      <section id="funciones" className="scroll-mt-20 py-16 sm:py-24 bg-slate-50 border-y border-slate-200/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <EncabezadoSeccion etiqueta="Todo en uno" titulo="Lo que tu recepción necesita, en un solo lugar" texto="Diseñado para que tu equipo aprenda a usarlo en minutos." />
          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {FUNCIONES.map(({ Icono, titulo, texto }) => (
              <div key={titulo} className="rounded-2xl bg-white p-6 border border-slate-200 hover:border-marca-200 hover:shadow-sm transition">
                <span className="w-11 h-11 rounded-xl bg-marca-50 text-marca-600 flex items-center justify-center"><Icono className="w-6 h-6" /></span>
                <h3 className="mt-4 font-semibold text-tinta-900">{titulo}</h3>
                <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{texto}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { e: '🏋️', t: 'Gimnasios', d: 'Mensualidades, visitas rápidas desde recepción y venta de suplementos.' },
              { e: '🔥', t: 'CrossFit y funcional', d: 'Planes por periodo, control de asistencia y tienda integrada.' },
              { e: '🧘', t: 'Yoga, pilates y barre', d: 'Paquetes con fechas personalizadas y seguimiento de cada alumno.' },
              { e: '🥋', t: 'Artes marciales y box', d: 'Inscripciones, mensualidades por alumno y credencial con su foto.' },
              { e: '💃', t: 'Danza y baile', d: 'Alumnos por paquete, renovaciones y control de quién asistió.' },
              { e: '🚴', t: 'Cycling y entrenamiento personal', d: 'Membresías por periodo, ventas en mostrador y caja por turno.' },
            ].map((x) => (
              <div key={x.t} className="flex gap-4 rounded-2xl bg-tinta-900 text-white p-6">
                <span className="text-2xl" aria-hidden="true">{x.e}</span>
                <div>
                  <h3 className="font-semibold">{x.t}</h3>
                  <p className="mt-1 text-sm text-slate-400">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= Cómo empezar */}
      <section id="como-empezar" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <EncabezadoSeccion etiqueta="Sin complicaciones" titulo="Empieza hoy en 3 pasos" />
          <ol className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {PASOS.map(({ Icono, titulo, texto }, i) => (
              <li key={titulo} className="relative">
                <div className="flex items-center gap-4">
                  <span className="w-12 h-12 rounded-2xl bg-marca-500 text-white flex items-center justify-center shadow-lg shadow-marca-500/25"><Icono className="w-6 h-6" /></span>
                  <span className="text-sm font-semibold text-marca-600">Paso {i + 1}</span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-tinta-900">{titulo}</h3>
                <p className="mt-1.5 text-slate-600">{texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ================================================= Precios */}
      <section id="precios" className="scroll-mt-20 py-16 sm:py-24 bg-slate-50 border-y border-slate-200/70">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <EncabezadoSeccion etiqueta="Precios" titulo="Un plan para cada etapa de tu negocio" texto="Precios en pesos mexicanos. Sin costos ocultos." />

          {cargando ? (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">{[0, 1, 2].map((i) => <div key={i} className="h-80 rounded-3xl bg-slate-200/60 animate-pulse" />)}</div>
          ) : planes.length === 0 ? (
            <div className="mt-12 text-center">
              <a href={enlaceWA('Hola, quiero conocer los precios de FitControl.')} target="_blank" rel="noopener noreferrer" className={clasesBoton('primario', 'lg')}>Solicitar cotización</a>
            </div>
          ) : (
            <div className={cx('mt-12 grid grid-cols-1 gap-6',
              planes.length >= 4 ? 'md:grid-cols-2 xl:grid-cols-4 xl:gap-4 xl:-mx-12'
                : planes.length === 3 ? 'lg:grid-cols-3'
                : planes.length === 2 ? 'md:grid-cols-2 max-w-3xl mx-auto'
                : 'max-w-md mx-auto')}>
              {planes.map((plan) => {
                const top = plan.id === destacado && planes.length > 1;
                return (
                  <div key={plan.id} className={cx('relative flex flex-col rounded-3xl p-7 sm:p-8', top ? 'bg-tinta-900 text-white shadow-2xl shadow-tinta-900/20 lg:-my-4 lg:py-12' : 'bg-white border border-slate-200')}>
                    {top && <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-marca-500 px-3 py-1 text-xs font-semibold text-white">Más elegido</span>}
                    <p className={cx('text-sm font-semibold', top ? 'text-marca-500' : 'text-marca-600')}>{NOMBRES_TIPO_PLAN[plan.tipo_plan]}</p>
                    <h3 className={cx('mt-1 text-xl font-semibold', top ? 'text-white' : 'text-tinta-900')}>{plan.nombre}</h3>
                    <p className="mt-5 flex items-baseline gap-1.5">
                      <span className="text-4xl font-bold tracking-tight tabular-nums">{formatoDinero(Number(plan.precio))}</span>
                      <span className={cx('text-sm', top ? 'text-slate-400' : 'text-slate-500')}>{SUFIJO_PRECIO[plan.tipo_plan]}</span>
                    </p>
                    {plan.descripcion && (
                      <p className={cx('mt-5 text-sm leading-relaxed', top ? 'text-slate-300' : 'text-slate-600')}>{plan.descripcion}</p>
                    )}
                    {/* Lo que incluye: sale de la configuración del plan en el panel (mismo dato que firma la licencia) */}
                    <ul className="mt-5 space-y-2 text-sm flex-1">
                      {[
                        ...MODULOS_BASE.map((nombre) => ({ nombre, incluido: true })),
                        // Sin la columna (antes de ejecutar 02_ediciones_y_modulos.sql) no se tacha nada
                        ...MODULOS_PREMIUM.map((m) => ({ nombre: m.nombre, incluido: plan.modulos === undefined || plan.modulos.includes(m.id) })),
                        { nombre: plan.max_usuarios ? `Hasta ${plan.max_usuarios} usuarios` : 'Usuarios ilimitados', incluido: true },
                        { nombre: textoActualizaciones(plan) + (plan.incluye_soporte ? ' y soporte' : ''), incluido: plan.meses_actualizaciones !== 0 },
                      ].map((f) => (
                        <li key={f.nombre} className={cx('flex items-start gap-2', !f.incluido && 'opacity-45 line-through')}>
                          {f.incluido
                            ? <IconoCheck className={cx('w-4 h-4 mt-0.5 shrink-0', top ? 'text-marca-500' : 'text-emerald-600')} />
                            : <IconoCerrar className="w-4 h-4 mt-0.5 shrink-0" />}
                          <span className={top ? 'text-slate-200' : 'text-slate-700'}>{f.nombre}</span>
                        </li>
                      ))}
                    </ul>
                    <a
                      href={enlaceWA(`Hola, me interesa el plan "${plan.nombre}" de FitControl para mi centro de entrenamiento.`)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={clasesBoton(top ? 'primario' : 'secundario', 'lg', 'mt-8 w-full')}
                    >
                      Elegir este plan
                    </a>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ================================================= Preguntas */}
      <section id="preguntas" className="scroll-mt-20 py-16 sm:py-24">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <EncabezadoSeccion etiqueta="Dudas" titulo="Preguntas frecuentes" />
          <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
            {PREGUNTAS.map(({ p, r }) => (
              <details key={p} className="group py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-tinta-900 [&::-webkit-details-marker]:hidden">
                  {p}
                  <span className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 transition group-open:rotate-90 group-open:bg-marca-50 group-open:text-marca-600">
                    <IconoChevron className="w-4 h-4" />
                  </span>
                </summary>
                <p className="mt-3 text-slate-600 leading-relaxed pr-12">{r}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================= Llamado final */}
      <section className="px-4 sm:px-6 lg:px-8 pb-16 sm:pb-24">
        <div className="mx-auto max-w-5xl relative overflow-hidden rounded-3xl bg-tinta-900 px-6 py-12 sm:p-16 text-center">
          <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-marca-500/25 blur-3xl" />
          <h2 className="relative text-3xl sm:text-4xl font-bold text-white">¿Listo para ordenar tu negocio fitness?</h2>
          <p className="relative mt-3 text-slate-400 max-w-xl mx-auto">Te ayudamos a instalarlo y a cargar tus primeros socios.</p>
          <a href={enlaceWA(MENSAJE_GENERAL)} target="_blank" rel="noopener noreferrer" className={clasesBoton('primario', 'lg', 'relative mt-8 w-full sm:w-auto')}>
            <IconoWhatsApp className="w-5 h-5" /> Escríbenos por WhatsApp
          </a>
        </div>
      </section>

      {/* ================================================= Pie */}
      <footer className="border-t border-slate-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 pb-24 sm:pb-8">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.png" alt="" width={24} height={24} className="rounded-md" />
            <span>© {new Date().getFullYear()} FitControl. Todos los derechos reservados.</span>
          </div>
          <div className="flex gap-6">
            {NAV.slice(0, 3).map((n) => <a key={n.href} href={n.href} className="hover:text-tinta-900">{n.texto}</a>)}
            <Link href="/login" className="hover:text-tinta-900">Acceso</Link>
          </div>
        </div>
      </footer>

      {/* Botón flotante de WhatsApp en celular */}
      <a
        href={enlaceWA(MENSAJE_GENERAL)}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Escribir por WhatsApp"
        className="sm:hidden fixed bottom-5 right-5 z-30 w-14 h-14 rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 flex items-center justify-center"
      >
        <IconoWhatsApp className="w-7 h-7" />
      </a>
    </div>
  );
}

function EncabezadoSeccion({ etiqueta, titulo, texto }: { etiqueta: string; titulo: string; texto?: string }) {
  return (
    <div className="text-center max-w-2xl mx-auto">
      <p className="text-sm font-semibold text-marca-600">{etiqueta}</p>
      <h2 className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight text-tinta-900">{titulo}</h2>
      {texto && <p className="mt-3 text-slate-600">{texto}</p>}
    </div>
  );
}

/** Ilustración de la app de escritorio hecha con HTML (se adapta a cualquier pantalla y no pesa). */
function MaquetaApp() {
  return (
    <div className="relative" aria-hidden="true">
      <div className="absolute -inset-6 bg-gradient-to-tr from-marca-500/20 to-transparent rounded-[2rem] blur-2xl -z-10" />
      <div className="rounded-2xl bg-white shadow-2xl shadow-tinta-900/10 ring-1 ring-slate-200 overflow-hidden">
        <div className="h-8 flex items-center gap-1.5 px-3 bg-slate-100 border-b border-slate-200">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /><span className="w-2.5 h-2.5 rounded-full bg-amber-400" /><span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <span className="ml-3 text-[10px] text-slate-500 font-medium">FitControl</span>
        </div>
        <div className="flex text-[10px] sm:text-xs">
          <div className="hidden sm:flex w-28 flex-col gap-1 bg-tinta-900 p-2.5">
            {['Inicio', 'Socios', 'Accesos', 'Ventas', 'Caja', 'Reportes'].map((m, i) => (
              <span key={m} className={cx('rounded-md px-2 py-1.5', i === 0 ? 'bg-marca-500 text-white font-semibold' : 'text-slate-400')}>{m}</span>
            ))}
          </div>
          <div className="flex-1 bg-slate-50 p-3 sm:p-4 space-y-3">
            <div className="grid grid-cols-3 gap-2">
              {[['Socios activos', '184', 'text-tinta-900'], ['Ingresos hoy', '$4,250', 'text-emerald-600'], ['Visitas hoy', '67', 'text-marca-600']].map(([t, v, c]) => (
                <div key={t} className="rounded-lg bg-white p-2 sm:p-2.5 ring-1 ring-slate-200">
                  <p className="text-slate-500 truncate">{t}</p>
                  <p className={cx('mt-0.5 text-sm sm:text-lg font-bold', c)}>{v}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-white p-2.5 sm:p-3 ring-1 ring-slate-200">
              <p className="font-semibold text-tinta-900 mb-2">Visitas de la semana</p>
              <div className="flex items-end gap-1.5 h-16 sm:h-20">
                {[45, 70, 55, 85, 65, 95, 40].map((h, i) => (
                  <div key={i} className="flex-1 rounded-t bg-marca-500/80" style={{ height: `${h}%` }} />
                ))}
              </div>
            </div>
            <div className="rounded-lg bg-white ring-1 ring-slate-200 divide-y divide-slate-100">
              {[['Ana Rodríguez', 'Acceso permitido', 'text-emerald-600'], ['Luis Herrera', 'Vence en 3 días', 'text-amber-600']].map(([n, e, c]) => (
                <div key={n} className="flex items-center justify-between px-2.5 py-2">
                  <span className="flex items-center gap-2 text-tinta-900"><span className="w-5 h-5 rounded-full bg-slate-200" />{n}</span>
                  <span className={cx('font-semibold', c)}>{e}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
