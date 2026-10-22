'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Instancia única centralizada

interface Cliente {
  id: number;
  nombre_empresa: string;
}

type TipoPlan = 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente';

interface Plan {
  id: number;
  nombre: string;
  tipo_plan: TipoPlan;
}

interface Licencia {
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
  clientes: { nombre_empresa: string } | null;
  planes: { nombre: string; tipo_plan: TipoPlan } | null;
}

// Fecha de término según el tipo de plan, contando a partir de "desde"
function calcularExpiracion(tipo: TipoPlan, desde: Date): Date {
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

const formatoFecha = (iso: string) =>
  new Date(iso).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });

// yyyy-mm-dd para <input type="date">
const aInputFecha = (iso: string) => new Date(iso).toISOString().slice(0, 10);

function estadoLicencia(lic: Licencia) {
  if (!lic.esta_activa) return { texto: 'Bloqueada', clase: 'text-slate-500 bg-slate-100 border-slate-200' };
  const dias = Math.ceil((new Date(lic.fecha_expiracion).getTime() - Date.now()) / 86_400_000);
  if (dias < 0) return { texto: 'Vencida', clase: 'text-rose-600 bg-rose-50 border-rose-200' };
  if (dias <= 15) return { texto: `Vence en ${dias} d`, clase: 'text-amber-600 bg-amber-50 border-amber-200' };
  return { texto: 'Activa', clase: 'text-emerald-600 bg-emerald-50 border-emerald-200' };
}

function haceCuanto(iso: string | null) {
  if (!iso) return null;
  const min = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (min < 60) return `hace ${Math.max(min, 1)} min`;
  const horas = Math.floor(min / 60);
  if (horas < 48) return `hace ${horas} h`;
  return `hace ${Math.floor(horas / 24)} días`;
}

export default function LicenciasPage() {
  // Sin rol hasta confirmarlo con Supabase (antes arrancaba como super_admin)
  const [userRole, setUserRole] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [licenciaEnEdicion, setLicenciaEnEdicion] = useState<Licencia | null>(null);

  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [copiada, setCopiada] = useState<number | null>(null);

  // Estados del Formulario
  const [clienteId, setClienteId] = useState('');
  const [planId, setPlanId] = useState('');
  const [claveLicencia, setClaveLicencia] = useState('');
  const [estaActiva, setEstaActiva] = useState(true);
  const [hardwareId, setHardwareId] = useState('');
  const [fechaExpiracion, setFechaExpiracion] = useState('');

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: perfil } = await supabase
        .from('perfiles')
        .select('rol')
        .eq('id', user.id)
        .maybeSingle();

      if (perfil && perfil.rol) {
        setUserRole(perfil.rol.toLowerCase());
      }
    }

    const { data: lic, error: errLic } = await supabase
      .from('licencias')
      .select('*, clientes(nombre_empresa), planes(nombre, tipo_plan)')
      .order('fecha_emision', { ascending: false });
    if (errLic) console.error('No se pudieron leer las licencias:', errLic.message);

    const { data: cli } = await supabase.from('clientes').select('id, nombre_empresa').order('nombre_empresa', { ascending: true });
    const { data: pln } = await supabase.from('planes').select('id, nombre, tipo_plan').eq('esta_disponible', true);

    if (lic) setLicencias(lic as Licencia[]);
    if (cli) setClientes(cli);
    if (pln) setPlanes(pln as Plan[]);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Solo controla qué botones se ven; Supabase (RLS) es quien realmente permite o niega
  const puedeCrearYEditar = ['super_admin', 'admin', 'manager'].includes(userRole);
  const puedeBorrar = ['super_admin', 'admin'].includes(userRole);

  // Serial con generador criptográfico (Math.random es predecible)
  const generarSerialUnico = () => {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const gen = (largo: number) => {
      const bytes = crypto.getRandomValues(new Uint32Array(largo));
      return Array.from(bytes, (n) => caracteres.charAt(n % caracteres.length)).join('');
    };
    setClaveLicencia(`FIT-PRO-${gen(4)}-${gen(4)}-${gen(4)}`);
  };

  const abrirModalNueva = () => {
    setLicenciaEnEdicion(null);
    generarSerialUnico();
    setIsModalOpen(true);
  };

  const abrirModalEdicion = (licencia: Licencia) => {
    setLicenciaEnEdicion(licencia);
    setClienteId(licencia.cliente_id.toString());
    setPlanId(licencia.plan_id.toString());
    setClaveLicencia(licencia.clave_licencia);
    setEstaActiva(licencia.esta_activa);
    setHardwareId(licencia.hardware_id || '');
    setFechaExpiracion(aInputFecha(licencia.fecha_expiracion));
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setLicenciaEnEdicion(null);
    setClienteId('');
    setPlanId('');
    setClaveLicencia('');
    setEstaActiva(true);
    setHardwareId('');
    setFechaExpiracion('');
  };

  const handleGuardarLicencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !planId || !puedeCrearYEditar) return;
    setLoading(true);

    const planElegido = planes.find(p => p.id === parseInt(planId));
    if (!planElegido && !licenciaEnEdicion) {
      setLoading(false);
      return;
    }

    let errorRes = null;

    if (licenciaEnEdicion) {
      // Al editar se RESPETA la fecha de término (antes se recalculaba desde hoy y se perdían días)
      const { error } = await supabase
        .from('licencias')
        .update({
          cliente_id: parseInt(clienteId),
          plan_id: parseInt(planId),
          esta_activa: estaActiva,
          hardware_id: hardwareId.trim() || null,
          fecha_expiracion: new Date(`${fechaExpiracion}T23:59:59`).toISOString(),
        })
        .eq('id', licenciaEnEdicion.id);
      errorRes = error;
    } else {
      const { error } = await supabase
        .from('licencias')
        .insert([{
          cliente_id: parseInt(clienteId),
          plan_id: parseInt(planId),
          clave_licencia: claveLicencia,
          fecha_expiracion: calcularExpiracion(planElegido!.tipo_plan, new Date()).toISOString(),
          esta_activa: estaActiva,
          hardware_id: null,
        }]);
      errorRes = error;
    }

    if (!errorRes) {
      cerrarModal();
      fetchData();
    } else {
      alert(`Error en operación: ${errorRes.message}`);
    }
    setLoading(false);
  };

  const toggleLicencia = async (id: number, estatusActual: boolean) => {
    if (!puedeCrearYEditar) return;
    const { error } = await supabase.from('licencias').update({ esta_activa: !estatusActual }).eq('id', id);
    if (error) alert(`No se pudo cambiar el estado: ${error.message}`);
    fetchData();
  };

  // Suma un periodo del plan a partir de la fecha de término actual (o de hoy si ya venció)
  const renovarLicencia = async (lic: Licencia) => {
    if (!puedeCrearYEditar || !lic.planes) return;
    const actual = new Date(lic.fecha_expiracion);
    const base = actual > new Date() ? actual : new Date();
    const nueva = calcularExpiracion(lic.planes.tipo_plan, base);
    const ok = confirm(`¿Renovar la licencia de ${lic.clientes?.nombre_empresa ?? 'este cliente'}?\n\nNuevo término: ${formatoFecha(nueva.toISOString())}\n\nLa PC del cliente tomará la nueva fecha en su próxima validación en línea (o con "Validar ahora" en Configuración).`);
    if (!ok) return;
    const { error } = await supabase
      .from('licencias')
      .update({ fecha_expiracion: nueva.toISOString(), esta_activa: true })
      .eq('id', lic.id);
    if (error) alert(`No se pudo renovar: ${error.message}`);
    fetchData();
  };

  // Desvincula la PC para que el cliente pueda activar la misma llave en otro equipo
  const liberarEquipo = async (lic: Licencia) => {
    if (!puedeCrearYEditar) return;
    const ok = confirm(`¿Liberar la llave ${lic.clave_licencia}?\n\nLa PC actual${lic.equipo_nombre ? ` (${lic.equipo_nombre})` : ''} dejará de validar en su próxima conexión y la llave podrá activarse en otro equipo.`);
    if (!ok) return;
    const { error } = await supabase.from('licencias').update({ hardware_id: null }).eq('id', lic.id);
    if (error) alert(`No se pudo liberar: ${error.message}`);
    fetchData();
  };

  const copiarClave = async (lic: Licencia) => {
    try {
      await navigator.clipboard.writeText(lic.clave_licencia);
      setCopiada(lic.id);
      setTimeout(() => setCopiada(null), 1500);
    } catch { /* el navegador no permite portapapeles */ }
  };

  const handleEliminarLicencia = async (id: number) => {
    if (!puedeBorrar) return;
    const conf = confirm('¿Remover esta licencia de software? El gimnasio perderá acceso en Windows en su próxima validación.');
    if (!conf) return;

    const { error } = await supabase.from('licencias').delete().eq('id', id);
    if (error) alert(`No se pudo eliminar: ${error.message}`);
    else fetchData();
  };

  const termino = busqueda.trim().toLowerCase();
  const licenciasFiltradas = termino
    ? licencias.filter(l =>
        l.clave_licencia.toLowerCase().includes(termino) ||
        (l.clientes?.nombre_empresa ?? '').toLowerCase().includes(termino) ||
        (l.equipo_nombre ?? '').toLowerCase().includes(termino))
    : licencias;

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden px-1">

      {/* HEADER ADAPTATIVO */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#232529] tracking-tight">Emisión de Licencias</h2>
          <p className="text-slate-400 text-[11px] sm:text-xs font-medium leading-relaxed">Llaves de activación firmadas, vinculación de equipos y última conexión de cada PC.</p>
        </div>

        {puedeCrearYEditar ? (
          <button
            onClick={abrirModalNueva}
            className="w-full sm:w-auto bg-[#F47521] hover:bg-[#d65f13] text-white font-bold px-5 py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
            Emitir Licencia
          </button>
        ) : (
          <div className="w-full sm:w-auto bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            Consola Protegida (Lectura)
          </div>
        )}
      </div>

      {/* RECUADRO INFORMATIVO DE BITÁCORA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row gap-3 justify-between sm:items-center bg-slate-50/50">
          <div className="flex items-center gap-3">
            <h3 className="text-xs font-bold text-[#232529] uppercase tracking-wider font-mono">Llaves de Activación en Producción</h3>
            <span className="bg-[#232529] text-white text-[9px] font-bold px-2.5 py-1 rounded-md font-mono">
              {licencias.length} SERIALES
            </span>
          </div>
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar cliente, llave o equipo…"
            className="w-full sm:w-64 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F47521] transition"
          />
        </div>

        {/* Contenedor Fluido con Scroll Deslizante Antidesbordes */}
        <div className="w-full overflow-x-auto selection:bg-transparent">
          <table className="w-full text-left border-collapse text-xs min-w-[1100px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="p-4">Establecimiento</th>
                <th className="p-4">Plan / Modalidad</th>
                <th className="p-4">Clave del Serial (Windows)</th>
                <th className="p-4">Equipo Vinculado</th>
                <th className="p-4">Última Conexión</th>
                <th className="p-4">Término / Estado</th>
                {puedeCrearYEditar && <th className="p-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {licenciasFiltradas.map((lic) => {
                const estado = estadoLicencia(lic);
                return (
                <tr key={lic.id} className="hover:bg-slate-50/40 transition">
                  <td className="p-4 font-bold text-[#232529] max-w-[180px] truncate">{lic.clientes?.nombre_empresa || 'Cuenta Removida'}</td>
                  <td className="p-4">
                    <div className="text-slate-700 font-bold leading-tight">{lic.planes?.nombre || 'Personalizado'}</div>
                    <div className="text-[9px] uppercase font-mono font-black text-[#F47521] mt-0.5">{lic.planes?.tipo_plan}</div>
                  </td>

                  <td className="p-4">
                    <div className="flex items-center gap-1.5">
                      <span className="bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-xl font-mono text-[10px] sm:text-[11px] font-black text-[#232529] tracking-wider inline-block shadow-3xs select-all">
                        {lic.clave_licencia}
                      </span>
                      <button
                        type="button"
                        onClick={() => copiarClave(lic)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition bg-white text-[10px] font-bold"
                        title="Copiar llave para enviarla al cliente"
                      >
                        {copiada === lic.id ? '✓' : '⧉'}
                      </button>
                    </div>
                  </td>

                  <td className="p-4">
                    {lic.hardware_id ? (
                      <div className="space-y-1 max-w-[170px]">
                        <div className="font-bold text-slate-700 truncate" title={lic.equipo_nombre ?? ''}>{lic.equipo_nombre || 'PC vinculada'}</div>
                        <span className="font-mono text-[10px] text-slate-500 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-md font-medium select-all block truncate" title={lic.hardware_id}>
                          {lic.hardware_id}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100/60 px-2 py-1 rounded-md inline-block whitespace-nowrap animate-pulse">
                        ⚠️ Esperando PC
                      </span>
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    {lic.ultima_validacion ? (
                      <>
                        <div className="font-bold text-slate-700">{haceCuanto(lic.ultima_validacion)}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{lic.version_app ? `v${lic.version_app}` : ''}</div>
                      </>
                    ) : (
                      <span className="text-slate-300 font-mono">—</span>
                    )}
                  </td>

                  <td className="p-4 whitespace-nowrap">
                    <div className="text-slate-500 font-mono font-bold">{formatoFecha(lic.fecha_expiracion)}</div>
                    <span className={`mt-1 inline-block text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${estado.clase}`}>
                      {estado.texto}
                    </span>
                  </td>

                  {/* ACCIONES */}
                  {puedeCrearYEditar && (
                    <td className="p-4 text-center">
                      <div className="flex justify-center items-center gap-2">

                        {/* Toggle Switch Deslizante Premium */}
                        <button
                          type="button"
                          onClick={() => toggleLicencia(lic.id, lic.esta_activa)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            lic.esta_activa ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={lic.esta_activa ? "Licencia Activa - Pausar terminal" : "Licencia Bloqueada - Autorizar terminal"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              lic.esta_activa ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Renovar un periodo */}
                        <button
                          onClick={() => renovarLicencia(lic)}
                          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg border border-slate-200 transition bg-white shadow-3xs"
                          title="Renovar un periodo del plan"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" /></svg>
                        </button>

                        {/* Liberar equipo */}
                        {lic.hardware_id && (
                          <button
                            onClick={() => liberarEquipo(lic)}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg border border-slate-200 transition bg-white shadow-3xs"
                            title="Liberar equipo (permitir activar en otra PC)"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5V6.75a4.5 4.5 0 1 1 9 0v3.75M3.75 21.75h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H3.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
                          </button>
                        )}

                        {/* Modificar */}
                        <button
                          onClick={() => abrirModalEdicion(lic)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition bg-white shadow-3xs"
                          title="Editar"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                        </button>

                        {/* Eliminar */}
                        {puedeBorrar ? (
                          <button
                            onClick={() => handleEliminarLicencia(lic.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition bg-white shadow-3xs"
                            title="Remover permanentemente"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-300 select-none px-1">Lock</span>
                        )}

                      </div>
                    </td>
                  )}
                </tr>
                );
              })}
              {licenciasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 font-medium">
                    {licencias.length === 0 ? 'No hay licencias o tu usuario no tiene permiso para verlas.' : 'Sin coincidencias.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL RESPONSIVO AJUSTADO CONTRA REBOTE DE TECLADOS MÓVILES */}
      {isModalOpen && puedeCrearYEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 relative max-h-[94vh] overflow-y-auto">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg p-1 transition">✕</button>

            <h3 className="text-xs sm:text-sm font-bold text-[#232529] uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 font-sans flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-[#F47521]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
              {licenciaEnEdicion ? 'Modificar Parámetros' : 'Emitir Licencia de Software'}
            </h3>

            <form onSubmit={handleGuardarLicencia} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Seleccionar Establecimiento</label>
                <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition">
                  <option value="">-- Selecciona un cliente --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Asignar Plan Comercial</label>
                <select required value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition">
                  <option value="">-- Selecciona un paquete --</option>
                  {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.tipo_plan})</option>)}
                </select>
                {!licenciaEnEdicion && (
                  <p className="text-[10px] text-slate-400 mt-1">El término se calcula desde hoy según el tipo de plan.</p>
                )}
              </div>

              {licenciaEnEdicion && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Fecha de Término</label>
                    <input
                      type="date"
                      required
                      value={fechaExpiracion}
                      onChange={(e) => setFechaExpiracion(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#F47521] focus:bg-white transition"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Cambiar el plan ya no modifica esta fecha. Usa el botón «Renovar» para sumar un periodo.</p>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Hardware ID (Ligar PC Windows)</label>
                    <input
                      type="text"
                      value={hardwareId}
                      onChange={(e) => setHardwareId(e.target.value)}
                      placeholder="Vacío para permitir otra PC"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#F47521] focus:bg-white transition"
                    />
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-slate-600">
                    <input type="checkbox" checked={estaActiva} onChange={(e) => setEstaActiva(e.target.checked)} className="accent-[#F47521] w-4 h-4" />
                    Licencia activa
                  </label>
                </>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Clave Serial de Activación</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={claveLicencia} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2.5 text-xs font-mono font-black text-center text-[#F47521] tracking-wider outline-none shadow-3xs" />
                  {!licenciaEnEdicion && (
                    <button type="button" onClick={generarSerialUnico} className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3.5 rounded-xl border border-slate-200 text-xs font-bold shrink-0 transition" title="Regenerar Token">🔄</button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider transition">Cancelar</button>
                <button disabled={loading || !clienteId || !planId} type="submit" className="w-1/2 bg-[#F47521] hover:bg-[#d65f13] text-white font-bold py-2.5 rounded-xl text-[10px] uppercase tracking-wider shadow-md disabled:opacity-50 transition">
                  {loading ? 'Procesando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
