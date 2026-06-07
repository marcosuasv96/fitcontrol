'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase'; // Conector unificado central

// DEFINICIÓN DE TIPOS FORMALES ADAPTADOS
interface LicenciaVencer {
  id: number;
  clave_licencia: string;
  fecha_expiracion: string;
  clientes: { nombre_empresa: string } | null;
  planes: { nombre: string } | null; // Tipado estricto e independiente
  dias_restantes: number;
}

interface PlanPopular {
  id: number;
  nombre_plan: string;
  precio: number;
  total_ventas: number;
  porcentaje: number;
}

export default function DashboardAdmin() {
  // Estados para tarjetas superiores
  const [totalClientes, setTotalClientes] = useState(0);
  const [licenciasActivas, setLicenciasActivas] = useState(0);
  const [licenciasPorVencerCount, setLicenciasPorVencerCount] = useState(0);
  const [ingresoEstimado, setIngresoEstimado] = useState(0);
  
  // Estados para las secciones analíticas
  const [proximosVencimientos, setProximosVencimientos] = useState<LicenciaVencer[]>([]);
  const [planesMasVendidos, setPlanesMasVendidos] = useState<PlanPopular[]>([]);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function cargarMétricasYListas() {
      setLoading(true);
      const hoy = new Date();
      
      // 1. Contar Clientes Totales
      const { count: cliCount } = await supabase.from('clientes').select('*', { count: 'exact', head: true });
      setTotalClientes(cliCount || 0);

      // 2. Contar Licencias Activas Generales
      const { count: licCount } = await supabase.from('licencias').select('*', { count: 'exact', head: true }).eq('esta_activa', true);
      setLicenciasActivas(licCount || 0);

      // 3. Obtener licencias vigentes vinculando tus columnas reales de Postgres
      const { data: licenciasData } = await supabase
        .from('licencias')
        .select('id, clave_licencia, fecha_expiracion, plan_id, esta_activa, clientes(nombre_empresa), planes(nombre, precio, tipo_plan)')
        .eq('esta_activa', true);

      if (licenciasData) {
        let sumaMensual = 0;
        let conteoVencimientos7Dias = 0;
        const listaVencimientos: LicenciaVencer[] = [];
        const conteoPlanes: { [key: number]: { nombre: string; precio: number; total: number } } = {};

        licenciasData.forEach((lic: any) => {
          if (lic.planes && lic.plan_id) {
            if (!conteoPlanes[lic.plan_id]) {
              conteoPlanes[lic.plan_id] = {
                nombre: lic.planes.nombre,
                precio: parseFloat(lic.planes.precio) || 0,
                total: 0
              };
            }
            conteoPlanes[lic.plan_id].total += 1;

            // ALGORITMO FINANCIERO BASADO EN TU ENUM DE PRODUCCIÓN
            const precio = parseFloat(lic.planes.precio) || 0;
            const vigencia = lic.planes.tipo_plan;
            
            switch (vigencia) {
              case 'mensual':
                sumaMensual += precio;
                break;
              case 'trimestral':
                sumaMensual += precio / 3;
                break;
              case 'semestral':
                sumaMensual += precio / 6;
                break;
              case 'anual':
                sumaMensual += precio / 12;
                break;
              case 'permanente':
                sumaMensual += precio * 0.05; // 5% de amortización contable mensual
                break;
              default:
                sumaMensual += precio;
            }

            // Calcular días restantes para vencimiento
            const expDate = new Date(lic.fecha_expiracion);
            const diferenciaTiempo = expDate.getTime() - hoy.getTime();
            const diasRestantes = Math.ceil(diferenciaTiempo / (1000 * 60 * 60 * 24));

            if (diasRestantes <= 30) {
              listaVencimientos.push({
                id: lic.id,
                clave_licencia: lic.clave_licencia,
                fecha_expiracion: lic.fecha_expiracion,
                clientes: lic.clientes,
                planes: { nombre: lic.planes.nombre }, // Asignación elástica exacta
                dias_restantes: diasRestantes
              });

              if (diasRestantes <= 7 && diasRestantes >= 0) {
                conteoVencimientos7Dias += 1;
              }
            }
          }
        });

        setIngresoEstimado(sumaMensual);
        setLicenciasPorVencerCount(conteoVencimientos7Dias);

        listaVencimientos.sort((a, b) => a.dias_restantes - b.dias_restantes);
        setProximosVencimientos(listaVencimientos.slice(0, 5));

        const totalLicenciasEmitidas = licenciasData.length || 1;
        const listaPlanesOrdenados: PlanPopular[] = Object.keys(conteoPlanes).map((key: any) => {
          const item = conteoPlanes[key];
          return {
            id: parseInt(key),
            nombre_plan: item.nombre,
            precio: item.precio,
            total_ventas: item.total,
            porcentaje: Math.round((item.total / totalLicenciasEmitidas) * 100)
          };
        });

        listaPlanesOrdenados.sort((a, b) => b.total_ventas - a.total_ventas);
        setPlanesMasVendidos(listaPlanesOrdenados);
      }

      setLoading(false);
    }

    cargarMétricasYListas();
  }, []);

  return (
    <div className="space-y-6 sm:space-y-8 p-4 sm:p-6 max-w-7xl mx-auto overflow-x-hidden">
      
      {/* Encabezado Adaptativo */}
      <div className="space-y-1">
        <h2 className="text-xl sm:text-2xl font-black text-[#232529] tracking-tight">Resumen Ejecutivo Global</h2>
        <p className="text-slate-400 text-[11px] sm:text-xs font-medium leading-relaxed">Métricas estructurales y rendimiento de licencias de FitControl en tiempo real.</p>
      </div>

      {/* Grid de Tarjetas de Indicadores (Fila única en móviles, grid expansivo después) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        
        {/* Clientes */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[140px]">
          <div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Clientes Totales</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" /></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-[#232529] mt-2 sm:mt-3 font-mono">{loading ? '...' : totalClientes}</p>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">Establecimientos registrados</span>
        </div>

        {/* Licencias Activas */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[140px]">
          <div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Licencias Vigentes</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-emerald-500"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-emerald-600 mt-2 sm:mt-3 font-mono">{loading ? '...' : licenciasActivas}</p>
          </div>
          <span className="text-[10px] text-emerald-600 font-bold block mt-2">● Servidores en producción</span>
        </div>

        {/* Alertas Críticas */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[140px]">
          <div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono">Alertas Críticas</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-amber-500"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z" /></svg>
            </div>
            <p className="text-2xl sm:text-3xl font-black text-amber-500 mt-2 sm:mt-3 font-mono">{loading ? '...' : licenciasPorVencerCount}</p>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">Vencimientos prox. 7 días</span>
        </div>

        {/* Ingresos Mensuales */}
        <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between min-h-[130px] sm:min-h-[140px]">
          <div>
            <div className="flex justify-between items-center text-slate-400">
              <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-[#F47521]">Ingresos Mensuales Est.</span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 text-[#F47521]"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797-2.101c.727 0 1.448.024 2.163.072m-17.96 4.029a60.142 60.142 0 0 0 2.528-3.041m15.432 3.041a60.143 60.143 0 0 1-2.528-3.041m0 0a59.82 59.82 0 0 1-4.144-4.213m4.144 4.213c.532.07 1.063.13 1.593.177M15.5 16.5V12m0 0a3 3 0 1 1 6 0v4.5m-6-4.5a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5A3.375 3.375 0 0 0 6.375 3H5.25m11.9-3.664A2.251 2.251 0 0 0 15 2.25v1.5a2.251 2.251 0 0 0 2.15 2.25h1.5a2.251 2.251 0 0 0 2.25-2.15v-1.5a2.251 2.251 0 0 0-2.25-2.25h-1.5ZM3 16.5v-2.25A2.25 2.25 0 0 1 5.25 12h1.5a2.25 2.25 0 0 1 2.25 2.25v2.25A2.25 2.25 0 0 1 6.75 18.75h-1.5A2.25 2.25 0 0 1 3 16.5Z" /></svg>
            </div>
            <p className="text-xl sm:text-2xl lg:text-3xl font-black text-[#232529] mt-2 sm:mt-3 font-mono truncate">
              ${loading ? '...' : ingresoEstimado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-[10px] text-slate-400 font-bold font-sans">MXN</span>
            </p>
          </div>
          <span className="text-[10px] text-slate-400 font-medium block mt-2">Flujo de caja SaaS amortizado</span>
        </div>
      </div>

      {/* SECCIÓN ANALÍTICA RESPONSIVA (Se apila verticalmente en móviles con flex-col o cols-1) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* TABLA DE PRÓXIMOS VENCIMIENTOS CON SCROLL SEGURO */}
        <div className="grid-cols-1 lg:col-span-7 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-2 justify-between sm:items-center">
              <h3 className="text-xs font-bold text-[#232529] uppercase tracking-wider font-sans flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                Alertas de Expiración Próximas
              </h3>
              <span className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase font-mono self-start sm:self-auto">Top 5 Inminentes</span>
            </div>

            {/* Contenedor con Scroll Horizontal Antidesborde */}
            <div className="w-full overflow-x-auto selection:bg-transparent">
              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs font-medium">Cargando bitácora de licencias...</div>
              ) : proximosVencimientos.length === 0 ? (
                <div className="p-12 text-center text-slate-400 text-xs font-medium">No hay licencias próximas a expirar en los siguientes 30 días.</div>
              ) : (
                <table className="w-full min-w-[500px] sm:min-w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/30 text-[10px] font-bold text-slate-400 uppercase font-mono tracking-wider">
                      <th className="p-3.5">Establecimiento</th>
                      <th className="p-3.5">Plan Contratado</th>
                      <th className="p-3.5">Estatus de Tiempo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {proximosVencimientos.map((lic) => (
                      <tr key={lic.id} className="hover:bg-slate-50/50 transition">
                        <td className="p-3.5 font-bold text-[#232529] max-w-[180px] truncate">{lic.clientes?.nombre_empresa}</td>
                        <td className="p-3.5 text-slate-500 font-medium">{lic.planes?.nombre}</td>
                        <td className="p-3.5">
                          {lic.dias_restantes < 0 ? (
                            <span className="bg-rose-50 border border-rose-100 text-rose-600 font-bold px-2.5 py-1 rounded-md text-[10px] inline-block whitespace-nowrap">
                              Vencida hace {Math.abs(lic.dias_restantes)} días
                            </span>
                          ) : lic.dias_restantes === 0 ? (
                            <span className="bg-amber-100 text-amber-800 font-black px-2.5 py-1 rounded-md text-[10px] animate-pulse inline-block whitespace-nowrap">
                              Vence Hoy
                            </span>
                          ) : lic.dias_restantes <= 7 ? (
                            <span className="bg-amber-50 border border-amber-100 text-amber-700 font-bold px-2.5 py-1 rounded-md text-[10px] inline-block whitespace-nowrap">
                              Expira en {lic.dias_restantes} días
                            </span>
                          ) : (
                            <span className="bg-slate-100 text-slate-600 font-medium px-2.5 py-1 rounded-md text-[10px] inline-block whitespace-nowrap">
                              {lic.dias_restantes} días vigentes
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-right">
            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Monitoreo Criptográfico Activo</span>
          </div>
        </div>

        {/* MÓDULO DE PLANES MÁS VENDIDOS */}
        <div className="grid-cols-1 lg:col-span-5 bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden flex flex-col justify-between">
          <div>
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
              <h3 className="text-xs font-bold text-[#232529] uppercase tracking-wider font-sans flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-[#F47521]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 1 3 2.48Z" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 0 0 .495-7.467 5.99 5.99 0 0 0-1.925 3.546 5.974 5.974 0 0 1-2.133-1A3.75 3.75 0 0 0 12 18Z" /></svg>
                Volumen de Planes SaaS
              </h3>
              <span className="text-[10px] font-bold text-[#F47521] uppercase font-mono tracking-wider">Métricas</span>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {loading ? (
                <div className="text-center text-slate-400 text-xs py-4 font-medium">Analizando facturación...</div>
              ) : planesMasVendidos.length === 0 ? (
                <div className="text-center text-slate-400 text-xs py-6 font-medium">Aún no hay licencias vinculadas para calcular tendencias.</div>
              ) : (
                planesMasVendidos.map((plan) => (
                  <div key={plan.id} className="space-y-1.5">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center text-xs gap-0.5">
                      <span className="font-bold text-[#232529]">{plan.nombre_plan}</span>
                      <span className="text-slate-400 font-mono text-[10px] sm:text-[11px]">
                        <strong className="text-slate-700">{plan.total_ventas}</strong> {plan.total_ventas === 1 ? 'cuenta' : 'cuentas'} ({plan.porcentaje}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200/40">
                      <div 
                        className="bg-[#F47521] h-full rounded-full transition-all duration-500" 
                        style={{ width: `${plan.porcentaje}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-center">
            <span className="text-[9px] font-bold text-slate-400 uppercase font-mono">Participación de mercado interna</span>
          </div>
        </div>

      </div>

      {/* Registro Informativo Inferior Adaptado */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start gap-3 sm:gap-4 shadow-md">
        <div className="p-2 bg-slate-800 rounded-lg border border-slate-700 text-[#F47521] shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 0 1-.879 2.122L7.5 21h9l-.621-.621A3 3 0 0 1 15 18.257V17.25m6-12V15a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 15V5.25m18 0A2.25 2.25 0 0 0 18.75 3H5.25A2.25 2.25 0 0 0 3 5.25m18 0V12a2.25 2.25 0 0 1-2.25 2.25H5.25A2.25 2.25 0 0 1 3 12V5.25" /></svg>
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-slate-200 text-xs sm:text-sm tracking-wide">Algoritmo Analítico Automatizado</h4>
          <p className="text-[10px] sm:text-[11px] text-slate-400 leading-relaxed">
            Los módulos inferiores evalúan de forma cruzada la fecha de expiración guardada en tu tabla de licencias contra la fecha del servidor, entregándote auditorías de tiempo inmediatas para prevenir cancelaciones y optimizar flujos de renovación de contratos comerciales.
          </p>
        </div>
      </div>
    </div>
  );
}