'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, type ComponentType } from 'react';
import { ProveedorSesion, useSesion, NOMBRES_ROL } from '@/lib/sesion';
import { ProveedorAvisos } from '@/components/avisos';
import { Esqueleto, Modal, Boton, cx } from '@/components/ui';
import { IconoInicio, IconoEdificio, IconoEtiqueta, IconoLlave, IconoSalir } from '@/components/iconos';

interface ItemMenu {
  href: string;
  texto: string;
  corto: string; // etiqueta de la barra inferior móvil
  Icono: ComponentType<{ className?: string }>;
}

const MENU: ItemMenu[] = [
  { href: '/admin', texto: 'Resumen', corto: 'Inicio', Icono: IconoInicio },
  { href: '/admin/clientes', texto: 'Clientes', corto: 'Clientes', Icono: IconoEdificio },
  { href: '/admin/licencias', texto: 'Licencias', corto: 'Licencias', Icono: IconoLlave },
  { href: '/admin/planes', texto: 'Planes y precios', corto: 'Planes', Icono: IconoEtiqueta },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProveedorSesion>
      <ProveedorAvisos>
        <Estructura>{children}</Estructura>
      </ProveedorAvisos>
    </ProveedorSesion>
  );
}

function Logo({ claro }: { claro?: boolean }) {
  return (
    <Link href="/admin" className="flex items-center gap-2.5">
      <Image src="/logo.png" alt="" width={32} height={32} className="rounded-lg object-contain" />
      <span className={cx('font-bold text-lg tracking-wide', claro ? 'text-white' : 'text-tinta-900')}>
        FIT<span className="text-marca-500">CONTROL</span>
      </span>
    </Link>
  );
}

function Avatar({ email }: { email: string }) {
  return (
    <span className="w-9 h-9 shrink-0 rounded-full bg-marca-500 text-white text-sm font-bold flex items-center justify-center uppercase">
      {email ? email[0] : '·'}
    </span>
  );
}

function Estructura({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sesion = useSesion();
  const [cuentaAbierta, setCuentaAbierta] = useState(false);

  const activo = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  return (
    <div className="min-h-dvh bg-slate-50">
      {/* ------------------------------------------------ Barra lateral (escritorio) */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 w-64 flex-col bg-tinta-900 text-white">
        <div className="h-16 flex items-center px-6 border-b border-white/5">
          <Logo claro />
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1" aria-label="Principal">
          <p className="px-3 mb-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500">Administración</p>
          {MENU.map(({ href, texto, Icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? 'page' : undefined}
              className={cx(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                activo(href) ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white',
              )}
            >
              <Icono className={cx('w-5 h-5', activo(href) && 'text-marca-500')} />
              {texto}
            </Link>
          ))}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
            <Avatar email={sesion.email} />
            <div className="min-w-0 flex-1">
              {sesion.cargando ? (
                <Esqueleto className="h-3.5 w-28 bg-white/10" />
              ) : (
                <>
                  <p className="truncate text-sm font-medium">{sesion.email}</p>
                  <p className="text-xs text-slate-400">{NOMBRES_ROL[sesion.rol] ?? sesion.rol}</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={sesion.cerrarSesion}
              aria-label="Cerrar sesión"
              title="Cerrar sesión"
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <IconoSalir className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* ------------------------------------------------ Barra superior (celular y tableta) */}
      <header className="lg:hidden sticky top-0 z-30 h-14 flex items-center justify-between px-4 bg-white/90 backdrop-blur border-b border-slate-200">
        <Logo />
        <button type="button" onClick={() => setCuentaAbierta(true)} aria-label="Mi cuenta">
          <Avatar email={sesion.email} />
        </button>
      </header>

      {/* ------------------------------------------------ Contenido */}
      <main className="lg:pl-64">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 sm:py-8 pb-28 lg:pb-10">
          {sesion.rol === 'sin rol' && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Tu usuario no tiene un rol asignado en la tabla <code className="font-mono">perfiles</code>, por eso no verás datos.
              Pide a un super admin que te asigne uno.
            </div>
          )}
          {children}
        </div>
      </main>

      {/* ------------------------------------------------ Navegación inferior (celular y tableta) */}
      <nav aria-label="Principal" className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-slate-200 pb-seguro">
        <div className="grid grid-cols-4">
          {MENU.map(({ href, corto, Icono }) => (
            <Link
              key={href}
              href={href}
              aria-current={activo(href) ? 'page' : undefined}
              className={cx(
                'flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                activo(href) ? 'text-marca-600' : 'text-slate-500',
              )}
            >
              <Icono className="w-6 h-6" />
              {corto}
            </Link>
          ))}
        </div>
      </nav>

      <Modal abierto={cuentaAbierta} onCerrar={() => setCuentaAbierta(false)} titulo="Mi cuenta" ancho="sm">
        <div className="flex items-center gap-3">
          <Avatar email={sesion.email} />
          <div className="min-w-0">
            <p className="truncate font-medium text-tinta-900">{sesion.email}</p>
            <p className="text-sm text-slate-500">{NOMBRES_ROL[sesion.rol] ?? sesion.rol}</p>
          </div>
        </div>
        <Boton variante="secundario" className="w-full mt-6" icono={<IconoSalir className="w-4 h-4" />} onClick={sesion.cerrarSesion}>
          Cerrar sesión
        </Boton>
      </Modal>
    </div>
  );
}
