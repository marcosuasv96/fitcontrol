'use client';

// Componentes base del panel FitControl. Todas las pantallas los usan para que
// botones, campos, tarjetas y ventanas se vean y se comporten igual.

import { useEffect, useId, useRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react';
import { IconoCerrar } from './iconos';

export function cx(...clases: (string | false | null | undefined)[]) {
  return clases.filter(Boolean).join(' ');
}

// ---------------------------------------------------------------- Botones

type Variante = 'primario' | 'secundario' | 'fantasma' | 'peligro' | 'oscuro';
type Tamano = 'sm' | 'md' | 'lg';

const VARIANTES: Record<Variante, string> = {
  primario: 'bg-marca-500 text-white hover:bg-marca-600 shadow-sm shadow-marca-500/20',
  secundario: 'bg-white text-tinta-900 border border-slate-200 hover:bg-slate-50 hover:border-slate-300',
  fantasma: 'text-slate-600 hover:bg-slate-100 hover:text-tinta-900',
  peligro: 'bg-rose-600 text-white hover:bg-rose-700',
  oscuro: 'bg-tinta-900 text-white hover:bg-tinta-800',
};

const TAMANOS: Record<Tamano, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5 rounded-lg',
  md: 'h-10 px-4 text-sm gap-2 rounded-xl',
  lg: 'h-12 px-6 text-sm gap-2 rounded-xl',
};

export function clasesBoton(variante: Variante = 'primario', tamano: Tamano = 'md', extra?: string) {
  return cx(
    'inline-flex items-center justify-center font-semibold transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
    VARIANTES[variante], TAMANOS[tamano], extra,
  );
}

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: Variante;
  tamano?: Tamano;
  cargando?: boolean;
  icono?: ReactNode;
}

export function Boton({ variante = 'primario', tamano = 'md', cargando, icono, className, children, disabled, type = 'button', ...props }: BotonProps) {
  return (
    <button type={type} disabled={disabled || cargando} className={clasesBoton(variante, tamano, className)} {...props}>
      {cargando ? <Spinner /> : icono}
      {children}
    </button>
  );
}

// Botón cuadrado solo con icono: el texto va en aria-label y en el tooltip
interface BotonIconoProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  etiqueta: string;
  tono?: 'neutro' | 'peligro' | 'exito' | 'aviso';
}

const TONOS_ICONO = {
  neutro: 'hover:text-tinta-900 hover:bg-slate-100',
  peligro: 'hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200',
  exito: 'hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200',
  aviso: 'hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200',
};

export function BotonIcono({ etiqueta, tono = 'neutro', className, children, type = 'button', ...props }: BotonIconoProps) {
  return (
    <button
      type={type}
      aria-label={etiqueta}
      title={etiqueta}
      className={cx('inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-400 transition-colors disabled:opacity-40', TONOS_ICONO[tono], className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function Spinner({ className = 'w-4 h-4' }: { className?: string }) {
  return (
    <svg className={cx('animate-spin', className)} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 0-10-10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

// ---------------------------------------------------------------- Estructura

export function Tarjeta({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx('bg-white border border-slate-200 rounded-2xl shadow-xs', className)}>{children}</div>;
}

export function EncabezadoPagina({ titulo, descripcion, acciones }: { titulo: string; descripcion?: string; acciones?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-tinta-900">{titulo}</h1>
        {descripcion && <p className="mt-1 text-sm text-slate-500 max-w-2xl">{descripcion}</p>}
      </div>
      {acciones && <div className="flex flex-wrap gap-2 shrink-0">{acciones}</div>}
    </div>
  );
}

export function EstadoVacio({ icono, titulo, descripcion, accion }: { icono?: ReactNode; titulo: string; descripcion?: string; accion?: ReactNode }) {
  return (
    <div className="flex flex-col items-center text-center px-6 py-14">
      {icono && <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mb-4">{icono}</div>}
      <p className="font-semibold text-tinta-900">{titulo}</p>
      {descripcion && <p className="mt-1 text-sm text-slate-500 max-w-sm">{descripcion}</p>}
      {accion && <div className="mt-5">{accion}</div>}
    </div>
  );
}

export function Esqueleto({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-lg bg-slate-200/70', className)} />;
}

// ---------------------------------------------------------------- Insignias

export type TonoInsignia = 'gris' | 'verde' | 'ambar' | 'rojo' | 'naranja' | 'azul';

const TONOS_INSIGNIA: Record<TonoInsignia, string> = {
  gris: 'bg-slate-100 text-slate-600 ring-slate-200',
  verde: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  ambar: 'bg-amber-50 text-amber-700 ring-amber-200',
  rojo: 'bg-rose-50 text-rose-700 ring-rose-200',
  naranja: 'bg-marca-50 text-marca-700 ring-marca-200',
  azul: 'bg-sky-50 text-sky-700 ring-sky-200',
};

export function Insignia({ tono = 'gris', punto, children, className }: { tono?: TonoInsignia; punto?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset whitespace-nowrap', TONOS_INSIGNIA[tono], className)}>
      {punto && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

// ---------------------------------------------------------------- Formularios

const CLASE_CONTROL = 'w-full rounded-xl border border-slate-200 bg-white px-3.5 text-sm text-tinta-900 placeholder:text-slate-400 transition focus:border-marca-500 focus:ring-4 focus:ring-marca-500/10 focus:outline-none disabled:bg-slate-50 disabled:text-slate-500';

interface CampoProps {
  etiqueta: string;
  ayuda?: string;
  error?: string;
  children: (id: string) => ReactNode;
  className?: string;
}

export function Campo({ etiqueta, ayuda, error, children, className }: CampoProps) {
  const id = useId();
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">{etiqueta}</label>
      {children(id)}
      {error ? <p className="mt-1.5 text-xs text-rose-600">{error}</p> : ayuda && <p className="mt-1.5 text-xs text-slate-500">{ayuda}</p>}
    </div>
  );
}

export function Entrada({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(CLASE_CONTROL, 'h-11', className)} {...props} />;
}

export function Selector({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(CLASE_CONTROL, 'h-11 pr-8', className)} {...props}>{children}</select>;
}

export function AreaTexto({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(CLASE_CONTROL, 'py-2.5 resize-none', className)} {...props} />;
}

export function Interruptor({ activo, onCambio, etiqueta, disabled }: { activo: boolean; onCambio: () => void; etiqueta: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={activo}
      aria-label={etiqueta}
      title={etiqueta}
      disabled={disabled}
      onClick={onCambio}
      className={cx(
        'relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        activo ? 'bg-emerald-500' : 'bg-slate-300',
      )}
    >
      <span className={cx('inline-block h-5 w-5 rounded-full bg-white shadow transition-transform', activo ? 'translate-x-5.5' : 'translate-x-0.5')} />
    </button>
  );
}

export function Alerta({ tono = 'rojo', children }: { tono?: 'rojo' | 'verde' | 'ambar'; children: ReactNode }) {
  const estilos = { rojo: 'bg-rose-50 border-rose-200 text-rose-700', verde: 'bg-emerald-50 border-emerald-200 text-emerald-700', ambar: 'bg-amber-50 border-amber-200 text-amber-800' };
  return <div role="alert" className={cx('rounded-xl border px-4 py-3 text-sm', estilos[tono])}>{children}</div>;
}

// ---------------------------------------------------------------- Modal

interface ModalProps {
  abierto: boolean;
  onCerrar: () => void;
  titulo: string;
  descripcion?: string;
  children: ReactNode;
  pie?: ReactNode;
  ancho?: 'sm' | 'md' | 'lg';
  /** "panel" se abre como hoja lateral en escritorio (ideal para detalles) */
  variante?: 'centro' | 'panel';
}

/**
 * En celular se muestra como hoja inferior (más fácil de usar con el pulgar);
 * en pantallas grandes como ventana centrada o panel lateral.
 * Se cierra con Esc o tocando el fondo y bloquea el scroll de la página.
 */
export function Modal({ abierto, onCerrar, titulo, descripcion, children, pie, ancho = 'md', variante = 'centro' }: ModalProps) {
  const ref = useRef<HTMLDivElement>(null);
  const idTitulo = useId();

  useEffect(() => {
    if (!abierto) return;
    const anterior = document.activeElement as HTMLElement | null;
    const alTeclear = (e: KeyboardEvent) => { if (e.key === 'Escape') onCerrar(); };
    document.addEventListener('keydown', alTeclear);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    // Enfoca el primer campo para poder escribir de inmediato
    requestAnimationFrame(() => {
      const primero = ref.current?.querySelector<HTMLElement>('input:not([readonly]), select, textarea, button[data-autofocus]');
      (primero ?? ref.current)?.focus();
    });
    return () => {
      document.removeEventListener('keydown', alTeclear);
      document.body.style.overflow = overflow;
      anterior?.focus?.();
    };
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  const anchos = { sm: 'sm:max-w-sm', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl' };
  const esPanel = variante === 'panel';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-tinta-950/50 backdrop-blur-[2px] animate-aparecer" onClick={onCerrar} />
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby={idTitulo}
        tabIndex={-1}
        className={cx(
          'relative w-full bg-white shadow-2xl flex flex-col outline-none',
          'max-h-[92dvh] rounded-t-3xl animate-subir',
          esPanel
            ? 'sm:fixed sm:inset-y-0 sm:right-0 sm:max-h-none sm:h-dvh sm:max-w-md sm:rounded-none sm:rounded-l-3xl sm:animate-deslizar'
            : cx('sm:rounded-2xl', anchos[ancho]),
        )}
      >
        {/* Asa visual en celular */}
        <div className="sm:hidden mx-auto mt-2.5 h-1.5 w-10 rounded-full bg-slate-200" />
        <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-4 sm:pt-6 pb-4 border-b border-slate-100">
          <div className="min-w-0">
            <h2 id={idTitulo} className="text-lg font-semibold text-tinta-900">{titulo}</h2>
            {descripcion && <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>}
          </div>
          <button type="button" onClick={onCerrar} aria-label="Cerrar" className="-mr-2 -mt-1 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <IconoCerrar />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5">{children}</div>
        {pie && <div className="px-5 sm:px-6 py-4 border-t border-slate-100 bg-slate-50/60 sm:rounded-b-2xl pb-seguro">{pie}</div>}
      </div>
    </div>
  );
}
