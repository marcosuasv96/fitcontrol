'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase'; // Conector unificado y veloz

// Modelado de datos idéntico a tu estructura Postgres SQL
interface Plan {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  tipo_plan: 'mensual' | 'trimestral' | 'semestral' | 'anual' | 'permanente';
  esta_disponible: boolean;
}

export default function PlanesPage() {
  const [userRole, setUserRole] = useState<string>('super_admin'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [planEnEdicion, setPlanEnEdicion] = useState<Plan | null>(null);

  // Estados del Formulario adaptados a tus columnas reales
  const [nombre, setNombre] = useState('');
  const [precio, setPrecio] = useState('');
  const [tipoPlan, setTipoPlan] = useState('mensual');
  const [descripcion, setDescripcion] = useState('');

  // Estados de carga e interfaz
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. OBTENER USUARIO, SU ROL REAL DE TU TABLA PERFILES Y LOS PLANES
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

    const { data } = await supabase
      .from('planes')
      .select('*')
      .order('precio', { ascending: true });

    if (data) setPlanes(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // MATRIZ DE REGLAS DE SEGURIDAD INTERNA
  const puedeCrearYEditar = ['super_admin', 'admin', 'manager'].includes(userRole);
  const puedeBorrar = ['super_admin', 'admin'].includes(userRole);

  // CONTROLADORES DEL MODAL
  const abrirModalEdicion = (plan: Plan) => {
    setPlanEnEdicion(plan);
    setNombre(plan.nombre);
    setPrecio(plan.precio.toString());
    setTipoPlan(plan.tipo_plan);
    setDescripcion(plan.descripcion || '');
    setIsModalOpen(true);
  };

  const cerrarModal = () => {
    setIsModalOpen(false);
    setPlanEnEdicion(null);
    setNombre('');
    setPrecio('');
    setTipoPlan('mensual');
    setDescripcion('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // 2. PROCESAR ACCIONES DE GUARDADO / ACTUALIZACIÓN (INSERT / UPDATE)
  const handleGuardarPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeCrearYEditar) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const precioNumerico = parseFloat(precio);
    if (isNaN(precioNumerico)) {
      setErrorMsg('Por favor introduce un valor de precio numérico válido.');
      setLoading(false);
      return;
    }

    const datosPlan = {
      nombre: nombre,
      precio: precioNumerico,
      tipo_plan: tipoPlan,
      descripcion: descripcion || null,
    };

    let respuestaError = null;

    if (planEnEdicion) {
      const { error } = await supabase
        .from('planes')
        .update(datosPlan)
        .eq('id', planEnEdicion.id);
      respuestaError = error;
    } else {
      const { error } = await supabase
        .from('planes')
        .insert([datosPlan]);
      respuestaError = error;
    }

    if (respuestaError) {
      setErrorMsg(`Error en base de datos: ${respuestaError.message}`);
      setLoading(false);
    } else {
      setSuccessMsg(planEnEdicion ? '¡Plan comercial modificado con éxito!' : '¡Paquete SaaS publicado correctamente!');
      setLoading(false);
      fetchData();
      setTimeout(() => { cerrarModal(); }, 1500);
    }
  };

  // 3. CAMBIAR DISPONIBILIDAD AL VUELO (SWITCH) - Disponible para admin y manager
  const toggleDisponibilidad = async (id: number, estatusActual: boolean) => {
    if (!puedeCrearYEditar) return;
    await supabase.from('planes').update({ esta_disponible: !estatusActual }).eq('id', id);
    fetchData();
  };

  // 4. ELIMINAR PLAN (FÍSICO Y DESTRUCTIVO) - Exclusivo super_admin y admin
  const handleEliminarPlan = async (id: number) => {
    if (!puedeBorrar) return;

    const confirmar = confirm('¿Está seguro de eliminar este plan de forma permanente de sus servidores comerciales? Esta acción romperá las ofertas actuales.');
    if (!confirmar) return;

    const { error } = await supabase.from('planes').delete().eq('id', id);
    if (!error) {
      fetchData();
    } else {
      alert(`Error de restricción relacional: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto overflow-x-hidden px-1">
      
      {/* HEADER PRINCIPAL RESPONSIVO */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <h2 className="text-xl sm:text-2xl font-black text-[#232529] tracking-tight">Estructura de Planes</h2>
          <p className="text-slate-400 text-[11px] sm:text-xs font-medium leading-relaxed">Configura el catálogo de empaquetado y licenciamientos comerciales.</p>
        </div>
        
        {puedeCrearYEditar ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-full sm:w-auto bg-[#F47521] hover:bg-[#d65f13] text-white font-bold px-5 py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2 shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Nuevo Plan
          </button>
        ) : (
          <div className="w-full sm:w-auto bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-slate-400 text-xs font-semibold shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            Catálogo Protegido (Lectura)
          </div>
        )}
      </div>

      {/* REJILLA DE TARJETAS COMERCIALES TOTALMENTE ADAPTATIVA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {planes.length === 0 ? (
          <div className="col-span-full p-12 sm:p-16 text-center bg-white rounded-2xl border-2 border-dashed border-slate-200 text-slate-400 text-xs font-medium">
            No se han parametrizado ofertas comerciales de licencias en la tabla global.
          </div>
        ) : (
          planes.map((plan) => (
            <div 
              key={plan.id} 
              className={`bg-white rounded-2xl border shadow-2xs overflow-hidden flex flex-col justify-between hover:shadow-xs transition ${
                !plan.esta_disponible ? 'opacity-60 border-slate-200 bg-slate-50/50' : 'border-slate-200'
              }`}
            >
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex justify-between items-center gap-2">
                  <span className="bg-slate-100 border border-slate-200 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-md font-mono shrink-0">
                    ID: #{plan.id}
                  </span>
                  
                  <span className="text-[9px] font-black text-[#F47521] uppercase tracking-wider bg-orange-50 px-2 py-0.5 rounded-md border border-orange-100 truncate">
                    Vigencia: {plan.tipo_plan}
                  </span>
                </div>

                <div>
                  <h3 className="text-base sm:text-xl font-black text-[#232529] tracking-tight truncate" title={plan.nombre}>
                    {plan.nombre}
                  </h3>
                  <div className="mt-1.5 flex items-baseline gap-1.5 flex-wrap">
                    <span className="text-2xl sm:text-3xl font-black text-[#232529] font-mono break-all">
                      ${Number(plan.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                    <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider font-mono bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 shrink-0">
                      MXN
                    </span>
                  </div>
                </div>

                <p className="text-slate-500 text-xs leading-relaxed border-t border-slate-50 pt-3 min-h-[48px] line-clamp-3">
                  {plan.descripcion || 'Sin descripción detallada disponible para este plan comercial.'}
                </p>
              </div>

              {/* ACCIONES DE LA TARJETA ADAPTADAS A MOVIL */}
              <div className="p-4 bg-slate-50/80 border-t border-slate-100 flex justify-between items-center gap-2">
                
                <button
                  disabled={!puedeCrearYEditar}
                  onClick={() => toggleDisponibilidad(plan.id, plan.esta_disponible)}
                  className={`text-[9px] sm:text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border transition whitespace-nowrap ${
                    plan.esta_disponible 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700' 
                      : 'bg-slate-100 border-slate-200 text-slate-400 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700'
                  }`}
                >
                  {plan.esta_disponible ? '● Visible' : '○ Pausado'}
                </button>

                {puedeCrearYEditar && (
                  <div className="flex gap-2 shrink-0">
                    <button 
                      onClick={() => abrirModalEdicion(plan)}
                      className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg border border-slate-200 transition bg-white shadow-3xs"
                      title="Editar parámetros"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                    </button>
                    
                    {puedeBorrar ? (
                      <button 
                        onClick={() => handleEliminarPlan(plan.id)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition bg-white shadow-3xs"
                        title="Eliminar de servidores"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                      </button>
                    ) : (
                      <span className="text-[9px] font-mono font-bold text-slate-300 flex items-center px-1">Bloqueado</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL INTELIGENTE AJUSTADO CONTRA DESBORDES EN PANTALLAS CHICAS */}
      {isModalOpen && puedeCrearYEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-5 sm:p-6 relative max-h-[92vh] overflow-y-auto">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg transition p-1" aria-label="Cerrar">✕</button>

            <h3 className="text-xs sm:text-sm font-bold text-[#232529] uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 font-sans flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/xl" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-[#F47521]"><path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581a2.25 2.25 0 0 0 3.181 0l5.105-5.105a2.25 2.25 0 0 0 0-3.181l-9.581-9.581a2.25 2.25 0 0 0-1.591-.659ZM6 7.5h.008v.008H6V7.5Z" /></svg>
              {planEnEdicion ? 'Modificar Parámetros' : 'Publicar Nuevo Plan SaaS'}
            </h3>

            {errorMsg && <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold p-3 rounded-xl text-center mb-4">{errorMsg}</div>}
            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-semibold p-3 rounded-xl text-center mb-4">{successMsg}</div>}

            <form onSubmit={handleGuardarPlan} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Nombre del Plan</label>
                <input type="text" required value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: FitControl Pro Mensual" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition" />
              </div>

              {/* Adaptación elástica: Grid de 1 columna en teléfonos y 2 en pantallas más anchas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Precio ($ MXN)</label>
                  <input type="number" step="0.01" required value={precio} onChange={(e) => setPrecio(e.target.value)} placeholder="Ej: 1299.00" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition font-mono" />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Tipo de Vigencia (ENUM)</label>
                  <select 
                    required 
                    value={tipoPlan} 
                    onChange={(e) => setTipoPlan(e.target.value)} 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition"
                  >
                    <option value="mensual">Mensual</option>
                    <option value="trimestral">Trimestral</option>
                    <option value="semestral">Semestral</option>
                    <option value="anual">Anual</option>
                    <option value="permanente">Permanente (Vitalicio)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Descripción Comercial</label>
                <textarea rows={3} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} placeholder="¿Qué alcances de software habilita este licenciamiento?" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition resize-none" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-[10px] uppercase tracking-wider">Cancelar</button>
                <button type="submit" disabled={loading} className="w-1/2 bg-[#F47521] hover:bg-[#d65f13] text-white font-bold py-2.5 rounded-xl transition text-[10px] uppercase tracking-wider shadow-md disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Confirmar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}