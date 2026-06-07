'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase';

interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  tipo_plan: 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente';
  esta_disponible: boolean;
}

export default function LandingPage() {
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false); // Estado para menú móvil

  const whatsappBaseUrl = "https://api.whatsapp.com/send/?phone=523316919113&type=phone_number&app_absent=0";
  const txtMatriz = encodeURIComponent("Hola, me interesa recibir más información sobre el sistema FitControl.");

  useEffect(() => {
    async function obtenerPlanesPublicos() {
      try {
        const { data, error } = await supabase
          .from('planes')
          .select('*')
          .eq('esta_disponible', true)
          .order('precio', { ascending: true });

        if (!error && data) setPlanes(data);
      } catch (err) {
        console.error("Error cargando el catálogo comercial:", err);
      } finally {
        setLoading(false);
      }
    }
    obtenerPlanesPublicos();
  }, []);

  return (
    <div className="overflow-x-hidden w-full relative">
      
      {/* BARRA DE NAVEGACIÓN COMPLETAMENTE RESPONSIVA */}
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-200 sticky top-0 z-50 rounded-b-xl sm:rounded-b-2xl shadow-xs">
        <div className="flex justify-between items-center h-20">
          
          {/* LOGO */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Image src="/logo.png" alt="FitControl Logo" width={36} height={36} className="rounded-lg object-contain" />
            <h1 className="text-xl font-black tracking-wider text-[#232529]">
              FIT<span className="text-[#F47521]">CONTROL</span>
            </h1>
          </div>

          {/* MENÚ DESKTOP (Oculto en móviles con 'hidden md:flex') */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#caracteristicas" className="text-sm font-semibold text-slate-600 hover:text-[#F47521] transition">Características</a>
            <a href="#disciplinas" className="text-sm font-semibold text-slate-600 hover:text-[#F47521] transition">Disciplinas</a>
            <a href="#planes" className="text-sm font-semibold text-slate-600 hover:text-[#F47521] transition">Precios</a>
            <a 
              href={`${whatsappBaseUrl}&text=${txtMatriz}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="bg-[#232529] hover:bg-slate-800 text-white font-bold px-5 py-2 rounded-xl transition text-xs tracking-wide"
            >
              Adquirir Ya
            </a>
          </div>

          {/* BOTÓN HAMBURGUESA (Solo visible en móviles con 'md:hidden') */}
          <div className="md:hidden flex items-center">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              type="button"
              className="inline-flex items-center justify-center p-2 rounded-xl text-slate-600 hover:bg-slate-100 focus:outline-none transition"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* DESPLEGABLE DE MENÚ MÓVIL */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-slate-100 py-4 space-y-3 bg-white animate-fadeIn">
            <a onClick={() => setIsMenuOpen(false)} href="#caracteristicas" className="block text-sm font-bold text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50">Características</a>
            <a onClick={() => setIsMenuOpen(false)} href="#disciplinas" className="block text-sm font-bold text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50">Disciplinas</a>
            <a onClick={() => setIsMenuOpen(false)} href="#planes" className="block text-sm font-bold text-slate-700 px-3 py-2 rounded-xl hover:bg-slate-50">Precios</a>
            <a 
              href={`${whatsappBaseUrl}&text=${txtMatriz}`} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="w-full text-center block bg-[#F47521] text-white font-bold py-3 rounded-xl text-xs uppercase tracking-wider shadow-md"
            >
              💬 Contactar WhatsApp
            </a>
          </div>
        )}
      </nav>

      {/* HERO SECTION ADAPTADO A MÓVILES */}
      <header className="max-w-7xl mx-auto pt-10 sm:pt-16 pb-20 px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
        <div className="lg:col-span-5 text-left space-y-5 sm:space-y-6">
          <span className="bg-orange-100 text-[#F47521] font-bold text-[10px] sm:text-xs uppercase tracking-widest px-3 sm:px-4 py-1.5 rounded-full inline-block">
            Software de Escritorio Nativo para Windows
          </span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-[#232529] leading-tight tracking-tight">
            Toma el control absoluto de tu centro fitness y <span className="text-[#F47521]">evita pérdidas</span>
          </h2>
          <p className="text-sm sm:text-base md:text-lg text-slate-600 leading-relaxed">
            Una herramienta diseñada para dueños de negocios exigentes. Monitorea ingresos de caja blindados, automatiza el stock de tu inventario y controla los accesos en milisegundos sin depender de conexiones lentas a internet.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a href="#planes" className="w-full sm:w-auto text-center bg-[#F47521] hover:bg-[#d65f13] text-white font-bold px-8 py-3.5 rounded-xl transition shadow-lg shadow-orange-500/10 text-sm tracking-wide">
              Comenzar Ahora
            </a>
            <a href="#caracteristicas" className="w-full sm:w-auto text-center bg-white hover:bg-slate-100 text-[#232529] font-bold px-8 py-3.5 rounded-xl transition border border-slate-200 text-sm tracking-wide">
              Conocer Módulos
            </a>
          </div>
        </div>

        {/* CONTENEDOR DE LA PORTADA DIGITAL */}
        <div className="lg:col-span-7 relative w-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/10 to-transparent rounded-3xl blur-2xl -z-10" />
          <div className="bg-white rounded-2xl p-2 sm:p-3 shadow-xl border border-slate-200/80">
            <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-[16/10] relative flex items-center justify-center p-3 sm:p-5">
              
              <div className="w-full h-full bg-slate-50 flex flex-col justify-between text-[9px] sm:text-[11px] space-y-3">
                <div className="flex justify-between items-center bg-white p-2 sm:p-3 rounded-lg sm:rounded-xl shadow-xs border border-slate-200/60">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    <span className="font-bold text-slate-800">FitControl Pro v1.0</span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold hidden sm:inline">● En Producción</span>
                </div>

                <div className="grid grid-cols-3 gap-2 my-1">
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <span className="text-slate-400 font-medium scale-90 origin-left">Caja Global</span>
                    <span className="font-black text-slate-800 sm:text-xs">$4,250</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <span className="text-slate-400 font-medium scale-90 origin-left">Socios</span>
                    <span className="font-black text-[#F47521] sm:text-xs">184 Activos</span>
                  </div>
                  <div className="bg-white p-2 rounded-lg border border-slate-200 flex flex-col justify-between shadow-2xs">
                    <span className="text-slate-400 font-medium scale-90 origin-left">Alertas</span>
                    <span className="font-black text-rose-600 sm:text-xs">3 Items</span>
                  </div>
                </div>

                <div className="bg-white p-2 rounded-lg border border-slate-200 overflow-hidden flex flex-col justify-center flex-1">
                  <span className="font-bold text-slate-700 mb-1 block">Último Acceso</span>
                  <div className="flex justify-between p-1.5 bg-emerald-50/50 border border-emerald-100 rounded-md text-[8px] sm:text-[10px]">
                    <span className="font-semibold text-slate-700 truncate max-w-[65%]">Marco Antonio (CrossFit)</span>
                    <span className="text-emerald-600 font-bold shrink-0">Permitido</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* IMPACTO DE NEGOCIO (GRID FIJO 2X2 EN MÓVILES) */}
      <section className="bg-[#232529] text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-2 md:grid-cols-4 gap-y-10 gap-x-4 text-center">
          <div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F47521]">0%</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Fugas en Caja</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F47521]">&lt; 1s</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Validación Socio</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F47521]">100%</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Autónomo s/Net</p>
          </div>
          <div>
            <p className="text-3xl sm:text-4xl md:text-5xl font-black text-[#F47521]">+25%</p>
            <p className="text-[10px] sm:text-xs text-slate-400 mt-1 uppercase tracking-wider font-bold">Renovaciones</p>
          </div>
        </div>
      </section>

      {/* MÓDULOS INTEGRADOS (CAMBIA A REJILLA VERTICAL EN MÓVIL) */}
      <section id="caracteristicas" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-16">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-[#232529]">Módulos potentes integrados</h3>
          <p className="text-slate-500 mt-2 text-sm sm:text-base">Un todo en uno diseñado específicamente para eliminar la carga administrativa de tu staff.</p>
        </div>

        <div className="space-y-16 sm:space-y-24">
          {/* MÓDULO 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
            <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-video relative shadow-inner flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40 flex items-end p-4 sm:p-6 z-30">
                <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Pantalla de Finanzas</span>
              </div>
              <span className="text-slate-300 font-mono text-xs">Captura de Caja</span>
            </div>
            <div className="space-y-3 sm:space-y-4">
              <div className="text-xl sm:text-2xl font-black text-[#232529]">Cortes de Caja Cifrados y Auditoría Absoluta</div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Cada moneda cuenta. FitControl bloquea el sistema contable por turnos de operarios. Registra cobros precisos divididos por métodos de pago (Efectivo, Tarjeta, Transferencia), impidiendo alteraciones de tiquets sin la clave máster del dueño.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2">✓ Reportes instantáneos exportables a Excel</li>
                <li className="flex items-center gap-2">✓ Registro estricto de gastos menores salientes</li>
              </ul>
            </div>
          </div>

          {/* MÓDULO 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center md:flex-row-reverse">
            <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-video relative shadow-inner flex items-center justify-center md:order-2">
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40 flex items-end p-4 sm:p-6 z-30">
                <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm">Tienda / Cafetería</span>
              </div>
              <span className="text-slate-300 font-mono text-xs">Captura de Inventario</span>
            </div>
            <div className="space-y-3 sm:space-y-4 md:order-1">
              <div className="text-xl sm:text-2xl font-black text-[#232529]">Punto de Venta e Inventario Inteligente</div>
              <p className="text-slate-600 text-xs sm:text-sm leading-relaxed">
                Multiplica tus ganancias vendiendo bebidas, suplementos o accesorios deportivos. El inventario descuenta productos en tiempo real al venderlos y te muestra una alerta visual roja en la barra superior cuando el stock de un producto llegue a su límite mínimo.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2">✓ Alertas de stock mínimo configurables</li>
                <li className="flex items-center gap-2">✓ Historial de compras amarrado al socio</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* DISCIPLINAS (REJILLA RESPONSIVA FLEXIBLE) */}
      <section id="disciplinas" className="bg-slate-100 py-20 border-y border-slate-200 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h3 className="text-2xl sm:text-3xl font-black text-[#232529]">Adaptable a cualquier formato Fitness</h3>
            <p className="text-slate-500 mt-2 text-sm">No importa cómo cobres ni cómo entrenen, FitControl tiene la flexibilidad que buscas.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xs border border-slate-200/60">
              <div className="text-base sm:text-lg font-bold text-[#232529] mb-2.5 flex items-center gap-2"><span>传统🏋️‍♂️</span> Gimnasios Tradicionales</div>
              <p className="text-xs text-slate-600 leading-relaxed">Perfecto para cobros mensuales fijos por uso de aparatos libres e integrados. Registro de visitas masivas rápidas desde recepción.</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xs border border-slate-200/60">
              <div className="text-base sm:text-lg font-bold text-[#232529] mb-2.5 flex items-center gap-2"><span>🔥</span> Boxes de CrossFit</div>
              <p className="text-xs text-slate-600 leading-relaxed">Controla cuotas basadas en frecuencias (ej: 3 clases por semana o pases ilimitados) y vende tus suples y bebidas.</p>
            </div>
            <div className="bg-white p-5 sm:p-6 rounded-2xl shadow-2xs border border-slate-200/60">
              <div className="text-base sm:text-lg font-bold text-[#232529] mb-2.5 flex items-center gap-2"><span>🧘</span> Estudios de Yoga / Pilates</div>
              <p className="text-xs text-slate-600 leading-relaxed">Lleva un control estricto por tiqueteras, bloques de clases o periodos especiales de entrenamiento personalizados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* PRECIOS DINÁMICOS RESPONSIVOS */}
      <section id="planes" className="max-w-6xl mx-auto px-4 py-20 scroll-mt-24">
        <h3 className="text-2xl sm:text-3xl font-black text-center mb-3 text-[#232529]">Precios de Licenciamiento</h3>
        <p className="text-center text-slate-500 mb-12 max-w-md mx-auto text-sm">Catálogo oficial en pesos mexicanos. Elige el esquema ideal para tu negocio.</p>
        
        {loading ? (
          <div className="text-center text-slate-400 text-xs py-12 font-mono animate-pulse">Consultando servidores...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {planes.map((plan) => {
              const txtDinamico = encodeURIComponent(`Hola, me interesa adquirir la licencia del plan "${plan.nombre}" para mi centro deportivo.`);
              return (
                <div 
                  key={plan.id} 
                  className={`bg-white p-6 sm:p-8 rounded-2xl flex flex-col justify-between shadow-xs transition border ${
                    plan.tipo_plan === 'anual' ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/5' : 'border-slate-200'
                  }`}
                >
                  <div>
                    <h4 className="text-lg sm:text-xl font-bold text-[#232529] mb-2">{plan.nombre}</h4>
                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span className="text-3xl sm:text-4xl font-black text-[#232529] font-mono">
                        ${Number(plan.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[10px] font-bold uppercase text-slate-400 font-mono">
                        / {plan.tipo_plan === 'permanente' ? 'Único' : plan.tipo_plan}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs sm:text-sm leading-relaxed border-t border-slate-50 pt-3">
                      {plan.descripcion || 'Incluye acceso completo a los módulos contables, de accesos e inventario.'}
                    </p>
                  </div>
                  <a 
                    href={`${whatsappBaseUrl}&text=${txtDinamico}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full mt-6 sm:mt-8 font-bold py-3 rounded-xl transition text-xs sm:text-sm block text-center uppercase tracking-wider ${
                      plan.tipo_plan === 'anual' 
                        ? 'bg-[#F47521] hover:bg-[#d65f13] text-white shadow-md' 
                        : 'bg-slate-100 hover:bg-slate-200 text-[#232529]'
                    }`}
                  >
                    Adquirir Licencia
                  </a>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* PREGUNTAS FRECUENTES (RESPONSIVO ARREGLADO) */}
      <section className="bg-white py-20 border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <h3 className="text-2xl sm:text-3xl font-black text-center text-[#232529] mb-12">Preguntas Frecuentes</h3>
          <div className="space-y-4 sm:space-y-6">
            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200/60">
              <h5 className="font-bold text-[#232529] text-xs sm:text-sm mb-1">¿Qué pasa si mi gimnasio se queda sin internet?</h5>
              <p className="text-xs text-slate-500 leading-relaxed">Nada. Al ser un desarrollo nativo en C# con base de datos local, el programa sigue operando al 100% localmente. Solo requiere red para validar tu licencia periódicamente.</p>
            </div>
            <div className="p-4 sm:p-5 bg-slate-50 rounded-xl border border-slate-200/60">
              <h5 className="font-bold text-[#232529] text-xs sm:text-sm mb-1">¿Puedo usar mi licencia en múltiples PCs?</h5>
              <p className="text-xs text-slate-500 leading-relaxed">Cada licencia está ligada a un identificador de hardware único (Hardware ID). Esto asegura que la clave se active de manera segura en un solo equipo físico para evitar piratería.</p>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center py-6 text-[10px] sm:text-xs text-slate-400 border-t border-slate-100 bg-white">
        &copy; {new Date().getFullYear()} FITCONTROL. Todos los derechos reservados.
      </footer>

    </div>
  );
}