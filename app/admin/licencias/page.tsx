'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Instancia única centralizada

interface Cliente { 
  id: number; 
  nombre_empresa: string; 
}

interface Plan { 
  id: number; 
  nombre: string; 
  tipo_plan: 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente'; 
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
  clientes: { nombre_empresa: string } | null;
  planes: { nombre: string; tipo_plan: string } | null;
}

export default function LicenciasPage() {
  const [userRole, setUserRole] = useState<string>('super_admin'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [licenciaEnEdicion, setLicenciaEnEdicion] = useState<Licencia | null>(null);
  
  const [licencias, setLicencias] = useState<Licencia[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);

  // Estados del Formulario
  const [clienteId, setClienteId] = useState('');
  const [planId, setPlanId] = useState('');
  const [claveLicencia, setClaveLicencia] = useState('');
  const [estaActiva, setEstaActiva] = useState(true);
  const [hardwareId, setHardwareId] = useState('');

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

    const { data: lic } = await supabase
      .from('licencias')
      .select('*, clientes(nombre_empresa), planes(nombre, tipo_plan)')
      .order('fecha_emision', { ascending: false });
    
    const { data: cli } = await supabase.from('clientes').select('id, nombre_empresa').order('nombre_empresa', { ascending: true });
    const { data: pln } = await supabase.from('planes').select('id, nombre, tipo_plan').eq('esta_disponible', true);

    if (lic) setLicencias(lic as any);
    if (cli) setClientes(cli);
    if (pln) setPlanes(pln);
  };

  useEffect(() => { 
    fetchData(); 
  }, []);

  const puedeCrearYEditar = ['super_admin', 'admin', 'manager'].includes(userRole);
  const puedeBorrar = ['super_admin', 'admin'].includes(userRole);

  const generarSerialUnico = () => {
    const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const gen = (largo: number) => Array.from({ length: largo }, () => caracteres.charAt(Math.floor(Math.random() * caracteres.length))).join('');
    setClaveLicencia(`FIT-PRO-${gen(4)}-${gen(4)}-${gen(4)}`);
  };

  const abrirModalEdicion = (licencia: Licencia) => {
    setLicenciaEnEdicion(licencia);
    setClienteId(licencia.cliente_id.toString());
    setPlanId(licencia.plan_id.toString());
    setClaveLicencia(licencia.clave_licencia);
    setEstaActiva(licencia.esta_activa);
    setHardwareId(licencia.hardware_id || '');
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
  };

  useEffect(() => {
    if (isModalOpen && !licenciaEnEdicion) generarSerialUnico();
  }, [isModalOpen, planId]);

  const handleGuardarLicencia = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId || !planId || !puedeCrearYEditar) return;
    setLoading(true);

    const planElegido = planes.find(p => p.id === parseInt(planId));
    if (!planElegido) {
      setLoading(false);
      return;
    }

    const fechaExpiracion = new Date();
    switch (planElegido.tipo_plan) {
      case 'mensual': fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 1); break;
      case 'trimestral': fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 3); break;
      case 'semestral': fechaExpiracion.setMonth(fechaExpiracion.getMonth() + 6); break;
      case 'anual': fechaExpiracion.setFullYear(fechaExpiracion.getFullYear() + 1); break;
      case 'permanente': fechaExpiracion.setFullYear(2099, 11, 31); break;
    }

    const datosLicencia = {
      cliente_id: parseInt(clienteId),
      plan_id: parseInt(planId),
      clave_licencia: claveLicencia,
      fecha_expiracion: fechaExpiracion.toISOString(),
      esta_activa: estaActiva,
      hardware_id: hardwareId || null
    };

    let errorRes = null;

    if (licenciaEnEdicion) {
      const { error } = await supabase
        .from('licencias')
        .update(datosLicencia)
        .eq('id', licenciaEnEdicion.id);
      errorRes = error;
    } else {
      const { error } = await supabase
        .from('licencias')
        .insert([datosLicencia]);
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
    await supabase.from('licencias').update({ esta_activa: !estatusActual }).eq('id', id);
    fetchData();
  };

  const handleEliminarLicencia = async (id: number) => {
    if (!puedeBorrar) return;
    const conf = confirm('¿Remover esta licencia de software? El gimnasio perderá acceso en Windows de inmediato.');
    if (!conf) return;

    const { error } = await supabase.from('licencias').delete().eq('id', id);
    if (!error) fetchData();
  };

  return (
    <div className="space-y-6">
      
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-[#232529] tracking-tight">Emisión de Licencias</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Generación de llaves de activación cifradas y monitoreo del Hardware ID vinculado.</p>
        </div>
        
        {puedeCrearYEditar ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F47521] hover:bg-[#d65f13] text-white font-bold px-5 py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
            Emitir Licencia
          </button>
        ) : (
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            Consola de Seriales Protegida
          </div>
        )}
      </div>

      {/* TABLA FLUIDA COMPORTAMIENTO PREMIUM */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-bold text-[#232529] uppercase tracking-wider font-mono">Llaves de Activación en Producción</h3>
          <span className="bg-[#232529] text-white text-[10px] font-bold px-2.5 py-1 rounded-md font-mono">
            {licencias.length} SERIALES EMITIDOS
          </span>
        </div>

        {/* Contenedor fluido con scroll horizontal nativo si la pantalla es muy chica */}
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <th className="p-4">Establecimiento</th>
                <th className="p-4">Plan / Modalidad</th>
                <th className="p-4">Clave del Serial (Windows)</th>
                <th className="p-4">Hardware ID Vincular</th>
                <th className="p-4">Término de Contrato</th>
                {puedeCrearYEditar && <th className="p-4 text-center">Acciones</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {licencias.map((lic) => (
                <tr key={lic.id} className="hover:bg-slate-50/60 transition">
                  <td className="p-4 font-bold text-[#232529] whitespace-nowrap">{lic.clientes?.nombre_empresa || 'Cuenta Removida'}</td>
                  <td className="p-4 whitespace-nowrap">
                    <div className="text-slate-700 font-bold leading-tight">{lic.planes?.nombre || 'Personalizado'}</div>
                    <div className="text-[9px] uppercase font-mono font-black text-[#F47521] mt-0.5">{lic.planes?.tipo_plan}</div>
                  </td>
                  
                  <td className="p-4 whitespace-nowrap">
                    <span className="bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-[11px] font-black text-[#232529] tracking-wider inline-block shadow-2xs">
                      {lic.clave_licencia}
                    </span>
                  </td>
                  
                  <td className="p-4 whitespace-nowrap">
                    {lic.hardware_id ? (
                      <span className="font-mono text-[10px] text-slate-700 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md font-medium select-all">
                        {lic.hardware_id}
                      </span>
                    ) : (
                      <span className="text-[9px] font-black text-amber-600 bg-amber-50 border border-amber-100/60 px-2 py-1 rounded-md">
                        ⚠️ Esperando Enlace
                      </span>
                    )}
                  </td>
                  
                  <td className="p-4 text-slate-500 font-mono font-bold whitespace-nowrap">
                    {new Date(lic.fecha_expiracion).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' })}
                  </td>
                  
                  {/* ACCIONES REMODELADAS CON TOGGLE SWITCH */}
                  {puedeCrearYEditar && (
                    <td className="p-4 text-center whitespace-nowrap">
                      <div className="flex justify-center items-center gap-3">
                        
                        {/* Toggle Switch Deslizante Premium */}
                        <button
                          type="button"
                          onClick={() => toggleLicencia(lic.id, lic.esta_activa)}
                          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            lic.esta_activa ? 'bg-emerald-500' : 'bg-slate-300'
                          }`}
                          title={lic.esta_activa ? "Licencia Activa - Clic para suspender" : "Licencia Suspendida - Clic para activar"}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                              lic.esta_activa ? 'translate-x-5' : 'translate-x-0'
                            }`}
                          />
                        </button>

                        {/* Lápiz para Modificar */}
                        <button 
                          onClick={() => abrirModalEdicion(lic)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition bg-white shadow-2xs"
                          title="Editar parámetros"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                        </button>

                        {/* Bote para Eliminar Destructivo */}
                        {puedeBorrar ? (
                          <button 
                            onClick={() => handleEliminarLicencia(lic.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition bg-white shadow-2xs"
                            title="Destruir serial"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                          </button>
                        ) : (
                          <span className="text-[9px] font-mono font-bold text-slate-300 select-none px-1">Lock</span>
                        )}

                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL MULTI-MODO DE LICENCIAS */}
      {isModalOpen && puedeCrearYEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg">✕</button>
            
            <h3 className="text-base font-bold text-[#232529] uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 font-sans flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-[#F47521]"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 0 1 3 3m3 0a6 6 0 0 1-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1 1 21.75 8.25Z" /></svg>
              {licenciaEnEdicion ? 'Modificar Parámetros de Licencia' : 'Emitir Licencia de Software'}
            </h3>

            <form onSubmit={handleGuardarLicencia} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Seleccionar Establecimiento</label>
                <select required value={clienteId} onChange={(e) => setClienteId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521]">
                  <option value="">-- Selecciona una cuenta de cliente --</option>
                  {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre_empresa}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Asignar Plan Comercial</label>
                <select required value={planId} onChange={(e) => setPlanId(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521]">
                  <option value="">-- Selecciona un paquete de licenciamiento --</option>
                  {planes.map(p => <option key={p.id} value={p.id}>{p.nombre} ({p.tipo_plan})</option>)}
                </select>
              </div>

              {licenciaEnEdicion && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Hardware ID (Ligar PC Windows)</label>
                  <input 
                    type="text" 
                    value={hardwareId} 
                    onChange={(e) => setHardwareId(e.target.value)} 
                    placeholder="Vacío para liberar y permitir otro equipo" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none focus:border-[#F47521]"
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Clave Serial de Activación</label>
                <div className="flex gap-2">
                  <input type="text" readOnly value={claveLicencia} className="w-full bg-slate-100 border border-slate-200 rounded-xl px-3 py-2 text-xs font-mono font-black text-center text-[#F47521] tracking-wider outline-none" />
                  {!licenciaEnEdicion && (
                    <button type="button" onClick={generarSerialUnico} className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-3 rounded-xl border border-slate-200 text-xs font-bold" title="Regenerar Token">🔄</button>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="w-1/2 bg-slate-100 text-slate-700 font-bold py-2.5 rounded-xl text-[10px] uppercase">Cancelar</button>
                <button disabled={loading || !clienteId || !planId} type="submit" className="w-1/2 bg-[#F47521] hover:bg-[#d65f13] text-white font-bold py-2.5 rounded-xl text-[10px] uppercase shadow-md disabled:opacity-50">
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