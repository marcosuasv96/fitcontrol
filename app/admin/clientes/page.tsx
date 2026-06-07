'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface Cliente {
  id: number;
  nombre_empresa: string;
  nombre_contacto: string | null;
  correo_contacto: string;
  telefono: string | null;
  fecha_registro: string;
}

export default function ClientesPage() {
  const [userRole, setUserRole] = useState<string>('super_admin'); 
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Estado para saber si estamos EDITANDO o CREANDO un cliente
  const [clienteEnEdicion, setClienteEnEdicion] = useState<Cliente | null>(null);

  // Estados del Formulario
  const [nombreEmpresa, setNombreEmpresa] = useState('');
  const [nombreContacto, setNombreContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [correoContacto, setCorreoContacto] = useState('');

  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

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
      .from('clientes')
      .select('*')
      .order('fecha_registro', { ascending: false });

    if (data) setClientes(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const puedeCrearYEditar = ['super_admin', 'admin', 'manager'].includes(userRole);
  const puedeBorrar = ['super_admin', 'admin'].includes(userRole);

  // FUNCIÓN PARA ABRIR EL MODAL EN MODO DE EDICIÓN
  const abrirModalEdicion = (cliente: Cliente) => {
    setClienteEnEdicion(cliente);
    setNombreEmpresa(cliente.nombre_empresa);
    setNombreContacto(cliente.nombre_contacto || '');
    setTelefono(cliente.telefono || '');
    setCorreoContacto(cliente.correo_contacto);
    setIsModalOpen(true);
  };

  // FUNCIÓN PARA CERRAR Y LIMPIAR EL FORMULARIO
  const cerrarModal = () => {
    setIsModalOpen(false);
    setClienteEnEdicion(null);
    setNombreEmpresa('');
    setNombreContacto('');
    setTelefono('');
    setCorreoContacto('');
    setErrorMsg('');
    setSuccessMsg('');
  };

  // PROCESAR GUARDADO (INSERCIÓN O ACTUALIZACIÓN)
  const handleGuardarCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!puedeCrearYEditar) return;

    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const datosCliente = {
      nombre_empresa: nombreEmpresa,
      nombre_contacto: nombreContacto || null,
      correo_contacto: correoContacto,
      telefono: telefono || null,
    };

    let respuestaError = null;

    if (clienteEnEdicion) {
      // MODO EDICIÓN: Actualizar fila existente
      const { error } = await supabase
        .from('clientes')
        .update(datosCliente)
        .eq('id', clienteEnEdicion.id);
      respuestaError = error;
    } else {
      // MODO CREACIÓN: Inyectar nueva fila
      const { error } = await supabase
        .from('clientes')
        .insert([datosCliente]);
      respuestaError = error;
    }

    if (respuestaError) {
      if (respuestaError.code === '23505') {
        setErrorMsg('Este correo electrónico ya está registrado con otra cuenta.');
      } else {
        setErrorMsg(`Error al procesar la operación: ${respuestaError.message}`);
      }
      setLoading(false);
    } else {
      setSuccessMsg(clienteEnEdicion ? '¡Cambios actualizados correctamente!' : '¡Establecimiento registrado con éxito!');
      setLoading(false);
      fetchData();

      setTimeout(() => {
        cerrarModal();
      }, 1500);
    }
  };

  const handleEliminarCliente = async (id: number) => {
    if (!puedeBorrar) return;

    const confirmar = confirm('¿Está seguro de eliminar este cliente de forma permanente? Esta acción no se puede deshacer.');
    if (!confirmar) return;

    const { error } = await supabase
      .from('clientes')
      .delete()
      .eq('id', id);

    if (!error) {
      fetchData();
    } else {
      alert(`Error de restricción: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* ENCABEZADO */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-2xl font-black text-[#232529] tracking-tight">Gestión de Clientes</h2>
          <p className="text-slate-400 text-xs mt-1 font-medium">Registro estructurado de centros deportivos, boxes y corporativos bajo contrato.</p>
        </div>
        
        {puedeCrearYEditar ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-[#F47521] hover:bg-[#d65f13] text-white font-bold px-5 py-3 rounded-xl transition text-xs uppercase tracking-wider shadow-lg shadow-orange-500/10 flex items-center justify-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
            Añadir Cliente
          </button>
        ) : (
          <div className="bg-slate-100 border border-slate-200 rounded-xl px-4 py-2.5 flex items-center gap-2 text-slate-400 text-xs font-semibold">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" /></svg>
            Modo Consulta (Lectura)
          </div>
        )}
      </div>

      {/* TABLA EJECUTIVA */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
          <h3 className="text-xs font-bold text-[#232529] uppercase tracking-wider font-mono">Cuentas Corporativas Activas</h3>
          <span className="bg-[#232529] text-white text-[10px] font-bold px-2.5 py-1 rounded-md font-mono">
            {clientes.length} REGISTROS
          </span>
        </div>

        <div className="overflow-x-auto">
          {clientes.length === 0 ? (
            <div className="p-16 text-center text-slate-400 text-xs font-medium">No hay registros vinculados en el nodo central de datos.</div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                  <th className="p-4">UUID ID</th>
                  <th className="p-4">Establecimiento / Empresa</th>
                  <th className="p-4">Contacto Titular</th>
                  <th className="p-4">Canales de Enlace</th>
                  <th className="p-4">Fecha de Alta</th>
                  {puedeCrearYEditar && <th className="p-4 text-center">Acciones</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50/60 transition">
                    <td className="p-4 text-slate-400 font-mono text-[11px]">#{cliente.id}</td>
                    <td className="p-4 font-bold text-[#232529]">{cliente.nombre_empresa}</td>
                    <td className="p-4 text-slate-600 font-medium">{cliente.nombre_contacto || 'No asignado'}</td>
                    <td className="p-4 space-y-0.5">
                      <div className="text-slate-700 font-medium">{cliente.correo_contacto}</div>
                      {cliente.telefono && <div className="text-slate-400 font-mono text-[10px]">{cliente.telefono}</div>}
                    </td>
                    <td className="p-4 text-slate-400 font-medium">{new Date(cliente.fecha_registro).toLocaleDateString()}</td>
                    
                    {puedeCrearYEditar && (
                      <td className="p-4">
                        <div className="flex justify-center items-center gap-2">
                          
                          {/* BOTÓN EDITAR (CONECTADO AL ESTADO DE APERTURA MULTI-MODO) */}
                          <button 
                            onClick={() => abrirModalEdicion(cliente)}
                            title="Modificar Información" 
                            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg border border-slate-200 transition"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
                          </button>
                          
                          {puedeBorrar ? (
                            <button onClick={() => handleEliminarCliente(cliente.id)} title="Eliminar" className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg border border-slate-200 hover:border-rose-200 transition">
                              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" /></svg>
                            </button>
                          ) : (
                            <span className="text-[10px] text-slate-300 font-mono font-bold select-none px-1">Restringido</span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* MODAL INTELIGENTE (MULTI-MODO: CREAR O EDITAR) */}
      {isModalOpen && puedeCrearYEditar && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg">✕</button>
            
            <h3 className="text-base font-bold text-[#232529] uppercase tracking-wider border-b border-slate-100 pb-3 mb-4 font-sans flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4 text-[#F47521]"><path strokeLinecap="round" strokeLinejoin="round" d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L6.832 19.82a4.5 4.5 0 0 1-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 0 1 1.13-1.897L16.863 4.487Zm0 0L19.5 7.125" /></svg>
              {clienteEnEdicion ? 'Modificar Cuenta Cliente' : 'Registrar Cuenta Cliente'}
            </h3>
            
            {errorMsg && <div className="bg-rose-50 border border-rose-200 text-rose-600 text-[11px] font-semibold p-3 rounded-xl text-center mb-4">{errorMsg}</div>}
            {successMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-[11px] font-semibold p-3 rounded-xl text-center mb-4">{successMsg}</div>}

            <form onSubmit={handleGuardarCliente} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Nombre del Establecimiento</label>
                <input type="text" required value={nombreEmpresa} onChange={(e) => setNombreEmpresa(e.target.value)} placeholder="Ej: Iron Forge Gym" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Nombre del Dueño / Contacto Encargado</label>
                <input type="text" value={nombreContacto} onChange={(e) => setNombreContacto(e.target.value)} placeholder="Ej: Carlos Mendoza" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Teléfono de Oficina o Celular</label>
                <input type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="Ej: +52 331 691 9113" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition" />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Correo Electrónico Corporativo</label>
                <input type="email" required value={correoContacto} onChange={(e) => setCorreoContacto(e.target.value)} placeholder="contacto@establecimiento.com" className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#F47521] focus:bg-white transition" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={cerrarModal} className="w-1/2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-2.5 rounded-xl transition text-[10px] uppercase tracking-wider">Cancelar</button>
                <button type="submit" disabled={loading} className="w-1/2 bg-[#F47521] hover:bg-[#d65f13] text-white font-bold py-2.5 rounded-xl transition text-[10px] uppercase tracking-wider shadow-md disabled:opacity-50">
                  {loading ? 'Guardando...' : 'Confirmar Cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}