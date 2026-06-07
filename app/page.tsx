'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { supabase } from '@/lib/supabase'; // Importación de tu conector centralizado

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

  // Base del enlace de WhatsApp
  const whatsappBaseUrl = "https://api.whatsapp.com/send/?phone=523316919113&type=phone_number&app_absent=0";
  const txtMatriz = encodeURIComponent("Hola, me interesa recibir más información sobre el sistema FitControl.");

  // 1. CARGAR ÚNICAMENTE PLANES DISPONIBLES EN TIEMPO REAL
  useEffect(() => {
    async function obtenerPlanesPublicos() {
      try {
        const { data, error } = await supabase
          .from('planes')
          .select('*')
          .eq('esta_disponible', true) // Solo los que activaste desde el admin
          .order('precio', { ascending: true });

        if (!error && data) {
          setPlanes(data);
        }
      } catch (err) {
        console.error("Error cargando el catálogo comercial:", err);
      } finally {
        setLoading(false);
      }
    }

    obtenerPlanesPublicos();
  }, []);

  return (
    <div className="bg-slate-50 text-slate-900 min-h-screen font-sans antialiased scroll-smooth">
      
      {/* Barra de Navegación */}
      <nav className="flex justify-between items-center p-6 max-w-7xl mx-auto border-b border-slate-200 bg-white shadow-sm rounded-b-2xl sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center">
            <Image
              src="/logo.png"
              alt="FitControl Logo"
              width={42}
              height={42}
              className="rounded-xl object-contain object-center"
            />
          </div>
          <h1 className="text-2xl font-black tracking-wider text-[#232529]">
            FIT<span className="text-[#F47521]">CONTROL</span>
          </h1>
        </div>
        <div className="flex items-center gap-6">
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
      </nav>

      {/* Hero Section */}
      <header className="max-w-7xl mx-auto pt-16 pb-24 px-6 grid lg:grid-cols-12 gap-12 items-center">
        <div className="lg:col-span-5 text-left space-y-6">
          <span className="bg-orange-100 text-[#F47521] font-bold text-xs uppercase tracking-widest px-4 py-1.5 rounded-full inline-block">
            Software de Escritorio Nativo para Windows
          </span>
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black text-[#232529] leading-tight">
            Toma el control absoluto de tu centro fitness y <span className="text-[#F47521]">evita pérdidas</span>
          </h2>
          <p className="text-base md:text-lg text-slate-600 leading-relaxed">
            Una herramienta diseñada para dueños de negocios exigentes. Monitorea ingresos de caja blindados, automatiza el stock de tu inventario y controla los accesos en milisegundos sin depender de conexiones lentas a internet.
          </p>
          <div className="flex flex-wrap gap-4 pt-2">
            <a href="#planes" className="bg-[#F47521] hover:bg-[#d65f13] text-white font-bold px-8 py-4 rounded-xl transition shadow-lg shadow-orange-500/20 text-sm tracking-wide">
              Comenzar Ahora
            </a>
            <a href="#caracteristicas" className="bg-white hover:bg-slate-100 text-[#232529] font-bold px-8 py-4 rounded-xl transition border border-slate-200 text-sm tracking-wide">
              Conocer Módulos
            </a>
          </div>
        </div>

        <div className="lg:col-span-7 relative w-full">
          <div className="absolute inset-0 bg-gradient-to-tr from-orange-400/10 to-transparent rounded-3xl blur-2xl -z-10" />
          <div className="bg-white rounded-2xl p-3 shadow-2xl border border-slate-200/80 backdrop-blur-sm">
            <div className="bg-slate-100 rounded-xl overflow-hidden border border-slate-200 aspect-[16/10] relative flex items-center justify-center">
              
              {/* <Image src="/portada-hero.jpg" alt="FitControl App Interface Principal" fill priority className="object-cover z-20" /> */}

              <div className="w-full h-full bg-slate-50 p-5 flex flex-col justify-between text-[11px]">
                <div className="flex justify-between items-center bg-white p-3 rounded-xl shadow-sm border border-slate-200/60">
                  <div className="flex items-center gap-2">
                    <Image src="/logo.png" alt="Mini Logo" width={16} height={16} />
                    <span className="font-bold text-slate-800">FitControl Pro v1.0</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-orange-50 text-[#F47521] font-bold">Turno Matutino</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold">● Base Activa</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 my-3 flex-1">
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <span className="text-slate-500 font-semibold">Corte de Caja Global</span>
                    <span className="text-base font-black text-slate-800">$4,250.00</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <span className="text-slate-500 font-semibold">Membresías Activas</span>
                    <span className="text-base font-black text-[#F47521]">184 Socios</span>
                  </div>
                  <div className="bg-white p-3 rounded-xl border border-slate-200 flex flex-col justify-between shadow-xs">
                    <span className="text-slate-500 font-semibold">Productos en Alerta</span>
                    <span className="text-base font-black text-rose-600">3 Ítems</span>
                  </div>
                </div>

                <div className="bg-white p-3 rounded-xl border border-slate-200 flex-1 overflow-hidden flex flex-col justify-center">
                  <span className="font-bold text-slate-700 mb-2 block">Últimos Accesos del Sistema</span>
                  <div className="space-y-1.5">
                    <div className="flex justify-between p-2 bg-emerald-50/50 border border-emerald-100 rounded-lg">
                      <span className="font-semibold text-slate-700">Marco Antonio (CrossFit Pro)</span>
                      <span className="text-emerald-600 font-bold">Acceso Permitido</span>
                    </div>
                    <div className="flex justify-between p-2 bg-amber-50/50 border border-amber-100 rounded-lg">
                      <span className="font-semibold text-slate-700">Diana Laura (Estudio Yoga)</span>
                      <span className="text-amber-600 font-bold">Vence en 2 días</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </header>

      {/* Impacto de Negocio */}
      <section className="bg-[#232529] text-white py-16">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          <div>
            <p className="text-4xl md:text-5xl font-black text-[#F47521]">0%</p>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-bold">Fugas de Dinero en Caja</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-black text-[#F47521]">&lt; 1s</p>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-bold">Validación de Membresía</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-black text-[#F47521]">100%</p>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-bold">Autónomo (No requiere Internet continuo)</p>
          </div>
          <div>
            <p className="text-4xl md:text-5xl font-black text-[#F47521]">+25%</p>
            <p className="text-xs text-slate-400 mt-2 uppercase tracking-wider font-bold">Incremento en Renovaciones</p>
          </div>
        </div>
      </section>

      {/* Características */}
      <section id="caracteristicas" className="py-24 max-w-7xl mx-auto px-6 scroll-mt-16">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h3 className="text-3xl md:text-4xl font-black text-[#232529]">Módulos potentes integrados</h3>
          <p className="text-slate-600 mt-3 text-base">Un todo en uno diseñado específicamente para eliminar la carga administrativa de tu staff.</p>
        </div>

        <div className="space-y-24">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-video relative shadow-inner flex items-center justify-center">
              {/* <Image src="/corte-caja-real.jpg" alt="Corte de caja FitControl" fill className="object-cover z-20" /> */}
              <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40 flex items-end p-6 z-30">
                <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow">Pantalla de Finanzas</span>
              </div>
              <span className="text-slate-300 font-mono text-xs">Espacio para captura de caja</span>
            </div>
            <div className="space-y-4">
              <div className="text-2xl font-black text-[#232529]">Cortes de Caja Cifrados y Auditoría Absoluta</div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Cada moneda cuenta. FitControl bloquea el sistema contable por turnos de operarios. Registra cobros precisos divididos por métodos de pago (Efectivo, Tarjeta, Transferencia), impidiendo alteraciones o cancelaciones de tickets sin la contraseña del dueño.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2">✓ Reportes instantáneos exportables a Excel</li>
                <li className="flex items-center gap-2">✓ Registro estricto de gastos menores salientes</li>
              </ul>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="space-y-4 md:order-2">
              <div className="bg-slate-100 rounded-2xl overflow-hidden border border-slate-200 aspect-video relative shadow-inner flex items-center justify-center">
                {/* <Image src="/inventario-real.jpg" alt="Módulo Inventario FitControl" fill className="object-cover z-20" /> */}
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/40 flex items-end p-6 z-30">
                  <span className="bg-white/90 text-slate-900 px-3 py-1.5 rounded-lg text-xs font-bold shadow">Control de Cafetería / Tienda</span>
                </div>
                <span className="text-slate-300 font-mono text-xs">Espacio para captura de inventario</span>
              </div>
            </div>
            <div className="space-y-4 md:order-1">
              <div className="text-2xl font-black text-[#232529]">Punto de Venta e Inventario Inteligente</div>
              <p className="text-slate-600 text-sm leading-relaxed">
                Multiplica tus ganancias vendiendo bebidas, suplementos, ropa o accesorios deportivos. El inventario descuenta productos en tiempo real al venderlos y te muestra una alerta visual roja en la barra superior cuando el stock está a punto de agotarse.
              </p>
              <ul className="space-y-2 text-xs font-bold text-slate-700">
                <li className="flex items-center gap-2">✓ Alertas automáticas de stock mínimo configurables</li>
                <li className="flex items-center gap-2">✓ Historial de compras amarrado al perfil del miembro</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Sección Multidisciplinaria */}
      <section id="disciplinas" className="bg-slate-100 py-24 border-y border-slate-200 scroll-mt-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h3 className="text-3xl font-black text-[#232529]">Adaptable a cualquier formato Fitness</h3>
            <p className="text-slate-600 mt-2 text-sm">No importa cómo cobres ni cómo entrenen, FitControl tiene la flexibilidad que buscas.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
              <div className="text-lg font-bold text-[#232529] mb-3 flex items-center gap-2"><span>🏋️‍♂️</span> Gimnasios Tradicionales</div>
              <p className="text-xs text-slate-600 leading-relaxed">Perfecto para cobros mensuales fijos por uso de aparatos libres e integrados. Registro de visitas masivas rápidas desde recepción.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
              <div className="text-lg font-bold text-[#232529] mb-3 flex items-center gap-2"><span>🔥</span> Boxes de CrossFit</div>
              <p className="text-xs text-slate-600 leading-relaxed">Controla cuotas basadas en frecuencias (ej: 3 clases por semana o pases libres ilimitados) y vende de forma cruzada tus bebidas hidratantes y proteínas.</p>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-xs border border-slate-200/60">
              <div className="text-lg font-bold text-[#232529] mb-3 flex items-center gap-2"><span>🧘</span> Estudios de Yoga o Pilates</div>
              <p className="text-xs text-slate-600 leading-relaxed">Lleva un control estricto por tiqueteras, bloques de clases o periodos especiales de entrenamiento personalizados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* SECCIÓN DE PRECIOS CONECTADA A LA BASE DE DATOS EN TIEMPO REAL (MXN) */}
      <section id="planes" className="max-w-6xl mx-auto px-4 py-24 scroll-mt-24">
        <h3 className="text-3xl font-black text-center mb-4 text-[#232529]">Precios de Licenciamiento</h3>
        <p className="text-center text-slate-600 mb-16 max-w-md mx-auto text-sm">Catálogo oficial en pesos mexicanos. Elige el esquema ideal para tu negocio.</p>
        
        {loading ? (
          <div className="text-center text-slate-400 text-sm py-12 font-medium font-mono animate-pulse">
            Consultando servidores comerciales de FitControl...
          </div>
        ) : planes.length === 0 ? (
          <div className="text-center text-slate-500 bg-white border border-slate-200 rounded-2xl p-12 text-sm font-medium">
            Por el momento no hay planes comerciales publicados. Comunícate a soporte técnico.
          </div>
        ) : (
          /* Generador responsivo automático de columnas según los planes que crees en el admin */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {planes.map((plan) => {
              // Generamos el texto de WhatsApp dinámico para este plan específico
              const txtDinamico = encodeURIComponent(`Hola, me interesa adquirir la licencia del plan "${plan.nombre}" para mi centro deportivo.`);
              
              return (
                <div 
                  key={plan.id} 
                  className={`bg-white p-8 rounded-2xl flex flex-col justify-between shadow-sm relative transition border ${
                    plan.tipo_plan === 'anual' ? 'border-2 border-[#F47521] shadow-xl shadow-orange-500/5' : 'border-slate-200'
                  }`}
                >
                  {plan.tipo_plan === 'anual' && (
                    <span className="absolute -top-3.5 right-6 bg-[#F47521] text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-wider font-mono">
                      Ahorro Premium
                    </span>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-[#232529] mb-2">{plan.nombre}</h4>
                    <div className="flex items-baseline gap-1.5 mb-4">
                      <span className="text-4xl font-black text-[#232529] font-mono">
                        ${Number(plan.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-xs font-bold uppercase text-slate-400 font-mono">
                        / {plan.tipo_plan === 'permanente' ? 'Único' : plan.tipo_plan}
                      </span>
                    </div>
                    <p className="text-slate-600 text-sm leading-relaxed border-t border-slate-50 pt-3">
                      {plan.descripcion || 'Incluye acceso completo a los módulos contables, de control de accesos e inventario de tienda.'}
                    </p>
                  </div>
                  <a 
                    href={`${whatsappBaseUrl}&text=${txtDinamico}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full mt-8 font-bold py-3 rounded-xl transition text-sm block text-center uppercase tracking-wide ${
                      plan.tipo_plan === 'anual' 
                        ? 'bg-[#F47521] hover:bg-[#d65f13] text-white shadow-md shadow-orange-500/10' 
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

      {/* Preguntas Frecuentes */}
      <section className="bg-white py-24 border-t border-slate-200">
        <div className="max-w-4xl mx-auto px-6">
          <h3 className="text-3xl font-black text-center text-[#232529] mb-12">Preguntas Frecuentes</h3>
          <div className="space-y-6">
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60">
              <h5 className="font-bold text-[#232529] text-sm mb-1">¿Qué pasa si mi gimnasio se queda temporalmente sin internet?</h5>
              <p className="text-xs text-slate-600 leading-relaxed">Nada. Al ser un desarrollo nativo en C# con base de datos local, el programa sigue operando al 100% (marcando accesos, cobrando y operando la tienda). Solo requiere conexión para la validación de la licencia periódica.</p>
            </div>
            <div className="p-5 bg-slate-50 rounded-xl border border-slate-200/60">
              <h5 className="font-bold text-[#232529] text-sm mb-1">¿Puedo usar mi licencia en múltiples computadoras?</h5>
              <p className="text-xs text-slate-600 leading-relaxed">Cada licencia está protegida por un identificador de hardware único (Hardware ID). Esto asegura que la clave se active de manera segura en un solo equipo físico para evitar la piratería o distribución no autorizada.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="text-center py-8 text-xs text-slate-500 border-t border-slate-200 bg-white">
        &copy; {new Date().getFullYear()} FITCONTROL. Todos los derechos reservados.
      </footer>

    </div>
  );
}