'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase'; // misma instancia (y misma sesión) que el resto del panel
import { Boton, Campo, Entrada, Alerta } from '@/components/ui';
import { IconoOjo, IconoOjoCerrado, IconoEscudo, IconoLlave, IconoGrafica } from '@/components/iconos';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });

    if (error) {
      setErrorMsg('El correo o la contraseña son incorrectos.');
      setLoading(false);
    } else {
      router.replace('/admin');
    }
  };

  return (
    <div className="min-h-dvh grid lg:grid-cols-2 bg-white">
      {/* Panel de marca (solo pantallas grandes) */}
      <div className="hidden lg:flex relative flex-col justify-between bg-tinta-900 text-white p-12 overflow-hidden">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-marca-500/20 blur-3xl" />
        <div className="absolute -bottom-40 -left-20 w-96 h-96 rounded-full bg-marca-500/10 blur-3xl" />

        <Link href="/" className="relative flex items-center gap-3">
          <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" />
          <span className="text-xl font-bold tracking-wide">FIT<span className="text-marca-500">CONTROL</span></span>
        </Link>

        <div className="relative space-y-8 max-w-md">
          <h2 className="text-4xl font-bold leading-tight">Tu consola para administrar clientes y licencias.</h2>
          <ul className="space-y-4 text-slate-300">
            <li className="flex gap-3"><IconoLlave className="w-6 h-6 text-marca-500 shrink-0" /> Emite y renueva llaves en segundos.</li>
            <li className="flex gap-3"><IconoEscudo className="w-6 h-6 text-marca-500 shrink-0" /> Cada licencia está firmada y vinculada a una sola PC.</li>
            <li className="flex gap-3"><IconoGrafica className="w-6 h-6 text-marca-500 shrink-0" /> Vencimientos, ingresos y equipos de un vistazo.</li>
          </ul>
        </div>

        <p className="relative text-xs text-slate-500">© {new Date().getFullYear()} FitControl</p>
      </div>

      {/* Formulario */}
      <div className="flex flex-col items-center justify-center px-5 py-10 sm:px-10">
        <div className="w-full max-w-sm">
          <Link href="/" className="lg:hidden flex items-center justify-center gap-2.5 mb-10">
            <Image src="/logo.png" alt="" width={40} height={40} className="rounded-xl" />
            <span className="text-xl font-bold tracking-wide text-tinta-900">FIT<span className="text-marca-500">CONTROL</span></span>
          </Link>

          <h1 className="text-2xl font-bold text-tinta-900">Iniciar sesión</h1>
          <p className="mt-1 text-sm text-slate-500">Consola de administración de FitControl.</p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            {errorMsg && <Alerta>{errorMsg}</Alerta>}

            <Campo etiqueta="Correo electrónico">
              {(id) => (
                <Entrada id={id} type="email" required autoComplete="email" inputMode="email" value={email}
                  onChange={(e) => setEmail(e.target.value)} placeholder="tu@correo.com" />
              )}
            </Campo>

            <Campo etiqueta="Contraseña">
              {(id) => (
                <div className="relative">
                  <Entrada id={id} type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password}
                    onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pr-12" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    className="absolute inset-y-0 right-0 px-3.5 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <IconoOjoCerrado /> : <IconoOjo />}
                  </button>
                </div>
              )}
            </Campo>

            <Boton type="submit" tamano="lg" cargando={loading} className="w-full">
              {loading ? 'Verificando…' : 'Entrar'}
            </Boton>
          </form>

          <p className="mt-10 text-center text-xs text-slate-400">
            ¿Buscas el programa para tu centro de entrenamiento? <Link href="/" className="text-marca-600 font-medium hover:underline">Conoce FitControl</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
