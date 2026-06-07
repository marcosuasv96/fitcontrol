'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { useEffect, useState } from 'react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Estado del menú móvil

  useEffect(() => {
    async function obtenerUsuarioYPerfil() {
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError || !user) {
        router.push('/login');
        return;
      }

      setUserEmail(user.email ?? 'Sin correo');

      const { data: perfil, error: perfilError } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

      if (perfilError) {
        console.error('Error al leer tabla perfiles de Supabase:', perfilError.message);
      }

      if (perfil && perfil.rol) {
        setUserRole(perfil.rol.toLowerCase());
      } else {
        setUserRole(user.role || 'admin');
      }
    }
    
    obtenerUsuarioYPerfil();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const activeClass = (path: string) => {
    const isExactMatch = pathname === path;
    return isExactMatch
      ? "flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#F47521] text-white font-bold text-sm transition shadow-lg shadow-orange-500/10"
      : "flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 font-semibold text-sm transition";
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans antialiased relative overflow-x-hidden">
      
      {/* 1. COMPONENTE MENÚ LATERAL (DESKTOP NATIVO / MOBILE CORTINA ABSOLUTA) */}
      <aside className={`
        fixed inset-y-0 left-0 w-64 bg-[#232529] text-white flex flex-col justify-between p-5 border-r border-slate-800 z-50 transition-transform duration-300 lg:static lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'}
      `}>
        <div className="space-y-8">
          {/* Logo y Botón para Cerrar Lateral en Móvil */}
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-3">
              <Image src="/logo.png" alt="FitControl Logo" width={32} height={32} className="rounded-lg object-contain" />
              <span className="font-bold text-lg tracking-wider">FIT<span className="text-[#F47521] font-black">CONTROL</span></span>
            </div>
            <button 
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" /></svg>
            </button>
          </div>

          {/* Navegación del Sistema */}
          <nav className="space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-2 mb-3">Sistemas Globales</p>
            
            <Link href="/admin" onClick={() => setIsSidebarOpen(false)} className={activeClass("/admin")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 8.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25A2.25 2.25 0 0 1 13.5 8.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" /></svg>
              Dashboard Overview
            </Link>
            
            <Link href="/admin/clientes" onClick={() => setIsSidebarOpen(false)} className={activeClass("/admin/clientes")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h18" /></svg>
              Cuentas de Clientes
            </Link>
            
            <Link href="/admin/planes" onClick={() => setIsSidebarOpen(false)} className={activeClass("/admin/planes")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.105-5.105a2.25 2.25 0 0 0 0-3.181l-9.581-9.581a2.25 2.25 0 0 0-1.591-.659ZM6 7.5h.008v.008H6V7.5Z" /></svg>
              Planes y Precios
            </Link>
            
            <Link href="/admin/licencias" onClick={() => setIsSidebarOpen(false)} className={activeClass("/admin/licencias")}>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
              Emisión de Licencias
            </Link>
          </nav>
        </div>

        <div className="border-t border-slate-800/80 pt-4 px-2">
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest font-mono block">FitControl Cloud v1.0</span>
        </div>
      </aside>

      {/* Sombra de fondo oscura para móviles cuando el menú lateral esté abierto */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
        />
      )}

      {/* 2. ÁREA DE CONTENIDO PRINCIPAL */}
      <main className="flex-1 flex flex-col min-h-screen min-w-0">
        
        {/* HEADER COMPLETAMENTE RESPONSIVO */}
        <header className="bg-white h-16 border-b border-slate-200 px-4 sm:px-8 flex justify-between items-center shadow-xs shrink-0 sticky top-0 z-30">
          
          {/* Botón Hamburguesa尊 (Móvil) */}
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 rounded-xl text-slate-500 hover:bg-slate-100 transition mr-1"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" /></svg>
            </button>
            <div className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest font-mono truncate max-w-[150px] sm:max-w-none">
              Consola Central
            </div>
          </div>
          
          {/* Datos del operario */}
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="flex items-center gap-1.5 sm:gap-2">
              {userEmail && (
                <span className="text-[10px] sm:text-xs font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 sm:px-3 py-1.5 rounded-xl font-mono max-w-[110px] sm:max-w-[200px] truncate">
                  {userEmail}
                </span>
              )}
              
              <div className="flex items-center gap-1.5 bg-slate-50 px-2 sm:px-3 py-1.5 rounded-xl border border-slate-200">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse hidden sm:inline-block" />
                <span className="text-[9px] sm:text-xs font-bold text-slate-700 uppercase tracking-wider font-mono">
                  {userRole ? `${userRole}` : '...'}
                </span>
              </div>
            </div>

            <div className="w-px h-6 bg-slate-200 hidden sm:block" />

            <button
              onClick={handleLogout}
              title="Cerrar Consola de Administración"
              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl border border-slate-200 hover:border-rose-200/60 transition group flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.8" stroke="currentColor" className="w-4 h-4 transform group-hover:translate-x-0.5 transition-transform">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6A2.25 2.25 0 0 0 5.25 5.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
              </svg>
            </button>
          </div>
        </header>

        {/* 3. SUB-DASHBOARD INYECTADO */}
        <div className="p-4 sm:p-8 flex-1 overflow-y-auto w-full">
          {children}
        </div>
      </main>

    </div>
  );
}