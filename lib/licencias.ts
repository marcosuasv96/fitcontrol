// Tipos y reglas de negocio de licencias compartidos por dashboard, clientes y licencias.

import type { TonoInsignia } from '@/components/ui';

export type TipoPlan = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente';

export const NOMBRES_TIPO_PLAN: Record<TipoPlan, string> = {
  mensual: 'Mensual',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
  permanente: 'Permanente',
};

export const SUFIJO_PRECIO: Record<TipoPlan, string> = {
  mensual: '/ mes',
  trimestral: '/ trimestre',
  semestral: '/ semestre',
  anual: '/ año',
  permanente: 'pago único',
};

export interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  tipo_plan: TipoPlan;
  esta_disponible: boolean;
}

export interface Cliente {
  id: number;
  nombre_empresa: string;
  nombre_contacto: string | null;
  correo_contacto: string;
  telefono: string | null;
  fecha_registro: string;
}

export interface Licencia {
  id: number;
  clave_licencia: string;
  fecha_emision: string;
  fecha_expiracion: string;
  esta_activa: boolean;
  hardware_id: string | null;
  cliente_id: number;
  plan_id: number;
  ultima_validacion: string | null;
  version_app: string | null;
  equipo_nombre: string | null;
  clientes: { nombre_empresa: string; telefono: string | null } | null;
  planes: { nombre: string; tipo_plan: TipoPlan; precio: number } | null;
}

/** Fecha de término según el tipo de plan, contando a partir de "desde". */
export function calcularExpiracion(tipo: TipoPlan, desde: Date): Date {
  const f = new Date(desde);
  switch (tipo) {
    case 'mensual': f.setMonth(f.getMonth() + 1); break;
    case 'trimestral': f.setMonth(f.getMonth() + 3); break;
    case 'semestral': f.setMonth(f.getMonth() + 6); break;
    case 'anual': f.setFullYear(f.getFullYear() + 1); break;
    case 'permanente': f.setFullYear(2099, 11, 31); break;
  }
  return f;
}

export function diasRestantes(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

export type EstadoLicencia = 'activa' | 'por_vencer' | 'vencida' | 'bloqueada' | 'sin_equipo';

export function estadoDe(lic: Pick<Licencia, 'esta_activa' | 'fecha_expiracion' | 'hardware_id'>): EstadoLicencia {
  if (!lic.esta_activa) return 'bloqueada';
  const dias = diasRestantes(lic.fecha_expiracion);
  if (dias < 0) return 'vencida';
  if (dias <= 15) return 'por_vencer';
  if (!lic.hardware_id) return 'sin_equipo';
  return 'activa';
}

export const PRESENTACION_ESTADO: Record<EstadoLicencia, { texto: string; tono: TonoInsignia }> = {
  activa: { texto: 'Activa', tono: 'verde' },
  por_vencer: { texto: 'Por vencer', tono: 'ambar' },
  vencida: { texto: 'Vencida', tono: 'rojo' },
  bloqueada: { texto: 'Suspendida', tono: 'gris' },
  sin_equipo: { texto: 'Sin activar', tono: 'azul' },
};

/** Ingreso mensual equivalente de una licencia (para métricas). */
export function ingresoMensual(tipo: TipoPlan, precio: number) {
  switch (tipo) {
    case 'mensual': return precio;
    case 'trimestral': return precio / 3;
    case 'semestral': return precio / 6;
    case 'anual': return precio / 12;
    default: return 0; // los pagos únicos no son ingreso recurrente
  }
}

/** Serial con generador criptográfico (Math.random es predecible). */
export function generarSerial() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const gen = (largo: number) =>
    Array.from(crypto.getRandomValues(new Uint32Array(largo)), (n) => caracteres.charAt(n % caracteres.length)).join('');
  return `FIT-PRO-${gen(4)}-${gen(4)}-${gen(4)}`;
}

// ---------------------------------------------------------------- Formatos

export const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

export const formatoDinero = (n: number) =>
  n.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: n % 1 === 0 ? 0 : 2 });

/** yyyy-mm-dd para <input type="date"> */
export const aInputFecha = (iso: string) => new Date(iso).toISOString().slice(0, 10);

/** true si el equipo nunca ha reportado o lleva más de `dias` sin validar su licencia. */
export function sinReportarDesde(iso: string | null, dias: number) {
  if (!iso) return true;
  return Date.now() - new Date(iso).getTime() > dias * 86_400_000;
}

export function haceCuanto(iso: string | null) {
  if (!iso) return null;
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 1) return 'hace un momento';
  if (min < 60) return `hace ${min} min`;
  const horas = Math.floor(min / 60);
  if (horas < 48) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} días`;
}

// ---------------------------------------------------------------- WhatsApp

/** Enlace wa.me con el número limpio (asume México si viene a 10 dígitos). */
export function enlaceWhatsApp(telefono: string | null | undefined, texto: string) {
  const base = 'https://wa.me/';
  let numero = (telefono ?? '').replace(/\D/g, '');
  if (numero.length === 10) numero = `52${numero}`;
  return `${base}${numero}?text=${encodeURIComponent(texto)}`;
}

export function mensajeEntregaLicencia(cliente: string, clave: string, vence: string) {
  return [
    `¡Hola! Te comparto la licencia de FitControl para ${cliente}.`,
    '',
    `🔑 Llave de activación: ${clave}`,
    `📅 Vigencia hasta: ${vence}`,
    '',
    'Pasos:',
    '1. Instala FitControl en la computadora de recepción.',
    '2. Al abrirlo por primera vez, pega la llave y presiona Activar (requiere internet solo en ese momento).',
    '3. Entra con el usuario administrador y cambia la contraseña cuando te lo pida.',
  ].join('\n');
}
