'use client'; // <-- Esto le dice a Next.js que este es un componente interactivo de React

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Inicializamos el conector rápido de Supabase usando tus variables del .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function LoginPage() {
  // Estados de React para capturar los datos del formulario
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Estado para controlar la visibilidad de la contraseña
  const [showPassword, setShowPassword] = useState(false);
  
  const router = useRouter();

  // Función de React que maneja el envío del formulario
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    // Petición directa al sistema de autenticación de Supabase
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      setErrorMsg('El correo electrónico o la contraseña son incorrectos.');
      setLoading(false);
    } else {
      // ¡Login correcto! El sistema te redirige automáticamente a la sección privada
      router.push('/admin');
    }
  };

  return (
    <div className="bg-slate-100 text-slate-900 min-h-screen flex items-center justify-center px-4 font-sans antialiased">
      <div className="bg-white border border-slate-200 p-8 rounded-2xl w-full max-w-md shadow-xl shadow-slate-200/50">
        
        {/* Identidad de la Marca */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-3">
            <Image
              src="/logo.png"
              alt="FitControl Logo"
              width={50}
              height={50}
              className="rounded-xl object-contain"
            />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-[#232529]">
            FIT<span className="text-[#F47521]">CONTROL</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1.5 font-medium uppercase tracking-wider">
            Consola de Administración Central
          </p>
        </div>

        {/* Caja de alerta si los datos están mal */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold p-3 rounded-xl mb-6 text-center">
            {errorMsg}
          </div>
        )}

        {/* Formulario React */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Correo Electrónico
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)} // React guarda el texto en tiempo real
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-900 text-sm focus:outline-none focus:border-[#F47521] focus:bg-white transition"
              placeholder="admin@fitcontrol.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-2">
              Contraseña
            </label>
            {/* Contenedor relativo para posicionar el botón del ojo */}
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'} // <-- Cambia dinámicamente el tipo
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)} // React guarda el texto en tiempo real
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-4 pr-12 py-3 text-slate-900 text-sm focus:outline-none focus:border-[#F47521] focus:bg-white transition"
                placeholder="••••••••"
              />
              {/* Botón interactivo dentro del input */}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition"
                title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? (
                  /* Icono Ojo Cerrado / Tachado (SVG limpio sin librerías extras) */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                ) : (
                  /* Icono Ojo Abierto */
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#F47521] hover:bg-[#d65f13] text-white font-bold py-3 rounded-xl transition text-sm shadow-md shadow-orange-500/10 disabled:opacity-50"
          >
            {loading ? 'Validando Credenciales...' : 'Iniciar Sesión'}
          </button>
        </form>

      </div>
    </div>
  );
}