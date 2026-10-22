'use client';

// Sesión del panel: usuario + rol (tabla perfiles), consultados UNA vez en el
// layout y compartidos con todas las páginas (antes cada página los pedía).
// Los permisos de aquí solo deciden qué botones se muestran; quien realmente
// permite o niega es Supabase con RLS (supabase/sql/01_seguridad_y_telemetria.sql).

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from './supabase';

export interface Sesion {
  email: string;
  rol: string;               // '' mientras carga; 'sin rol' si no hay fila en perfiles
  cargando: boolean;
  puedeEditar: boolean;      // super_admin, admin, manager
  puedeBorrar: boolean;      // super_admin, admin
  cerrarSesion: () => Promise<void>;
}

const Contexto = createContext<Sesion | null>(null);

export function useSesion() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useSesion debe usarse dentro de <ProveedorSesion>');
  return ctx;
}

export const NOMBRES_ROL: Record<string, string> = {
  super_admin: 'Super admin',
  admin: 'Administrador',
  manager: 'Gerente',
  'sin rol': 'Sin rol',
};

export function ProveedorSesion({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    let vigente = true;

    async function cargar() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!vigente) return;
      if (!user) { router.replace('/login'); return; }

      setEmail(user.email ?? '');
      const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).maybeSingle();
      if (!vigente) return;
      setRol(perfil?.rol ? String(perfil.rol).toLowerCase() : 'sin rol');
      setCargando(false);
    }
    cargar();

    // Si la sesión se cierra en otra pestaña o expira, regresa al login
    const { data: { subscription } } = supabase.auth.onAuthStateChange((evento) => {
      if (evento === 'SIGNED_OUT') router.replace('/login');
    });

    return () => { vigente = false; subscription.unsubscribe(); };
  }, [router]);

  const valor: Sesion = {
    email,
    rol,
    cargando,
    puedeEditar: ['super_admin', 'admin', 'manager'].includes(rol),
    puedeBorrar: ['super_admin', 'admin'].includes(rol),
    cerrarSesion: async () => { await supabase.auth.signOut(); router.replace('/login'); },
  };

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
