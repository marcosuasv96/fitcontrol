'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useSesion } from '@/lib/sesion';
import { useAvisos } from '@/components/avisos';
import { type Cliente, formatoFecha, enlaceWhatsApp } from '@/lib/licencias';
import { Boton, BotonIcono, Tarjeta, EncabezadoPagina, EstadoVacio, Esqueleto, Modal, Campo, Entrada, Alerta, Insignia, clasesBoton } from '@/components/ui';
import { IconoMas, IconoBuscar, IconoEdificio, IconoLapiz, IconoBasura, IconoLlave, IconoTelefono, IconoCorreo, IconoWhatsApp } from '@/components/iconos';

type ClienteConConteo = Cliente & { licencias: { count: number }[] };

export default function ClientesPage() {
  const { puedeEditar, puedeBorrar } = useSesion();
  const { avisar, confirmar } = useAvisos();

  const [clientes, setClientes] = useState<ClienteConConteo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [busqueda, setBusqueda] = useState('');
  const [formulario, setFormulario] = useState<{ cliente?: Cliente } | null>(null);

  const cargar = useCallback(async () => {
    const { data, error } = await supabase
      .from('clientes')
      .select('*, licencias(count)')
      .order('fecha_registro', { ascending: false });
    if (error) avisar(`No se pudieron leer los clientes: ${error.message}`, 'error');
    setClientes((data as ClienteConConteo[]) ?? []);
    setCargando(false);
  }, [avisar]);

  // Carga inicial desde Supabase (los setState ocurren al llegar la respuesta)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { cargar(); }, [cargar]);

  const visibles = useMemo(() => {
    const t = busqueda.trim().toLowerCase();
    if (!t) return clientes;
    return clientes.filter((c) =>
      [c.nombre_empresa, c.nombre_contacto, c.correo_contacto, c.telefono].some((v) => v?.toLowerCase().includes(t)));
  }, [clientes, busqueda]);

  const eliminar = async (c: ClienteConConteo) => {
    const total = c.licencias?.[0]?.count ?? 0;
    const ok = await confirmar({
      titulo: 'Eliminar cliente',
      mensaje: total > 0
        ? `${c.nombre_empresa} tiene ${total} licencia(s). Elimínalas o reasígnalas primero; si no, la base de datos rechazará la operación.`
        : `Se eliminará ${c.nombre_empresa} de forma permanente.`,
      textoConfirmar: 'Eliminar',
      peligro: true,
    });
    if (!ok) return;
    const { error } = await supabase.from('clientes').delete().eq('id', c.id);
    if (error) { avisar(`No se pudo eliminar: ${error.message}`, 'error'); return; }
    avisar('Cliente eliminado');
    cargar();
  };

  return (
    <div className="space-y-6">
      <EncabezadoPagina
        titulo="Clientes"
        descripcion="Gimnasios, boxes, estudios, academias y centros de entrenamiento que usan FitControl."
        acciones={puedeEditar && (
          <Boton icono={<IconoMas className="w-4 h-4" />} onClick={() => setFormulario({})} className="w-full sm:w-auto">Nuevo cliente</Boton>
        )}
      />

      <Tarjeta className="overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100">
          <div className="relative">
            <IconoBuscar className="w-5 h-5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <Entrada type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Buscar por nombre, contacto, correo o teléfono" className="pl-11" aria-label="Buscar clientes" />
          </div>
        </div>

        {cargando ? (
          <div className="p-5 space-y-3">{[0, 1, 2].map((i) => <Esqueleto key={i} className="h-16" />)}</div>
        ) : visibles.length === 0 ? (
          <EstadoVacio
            icono={<IconoEdificio />}
            titulo={clientes.length === 0 ? 'Aún no tienes clientes' : 'Sin resultados'}
            descripcion={clientes.length === 0 ? 'Registra tu primer cliente para poder emitirle una licencia.' : 'Prueba con otra búsqueda.'}
            accion={clientes.length === 0 && puedeEditar && <Boton icono={<IconoMas className="w-4 h-4" />} onClick={() => setFormulario({})}>Nuevo cliente</Boton>}
          />
        ) : (
          <ul className="divide-y divide-slate-100">
            {visibles.map((c) => {
              const total = c.licencias?.[0]?.count ?? 0;
              return (
                <li key={c.id} className="px-4 sm:px-5 py-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
                  <div className="flex items-center gap-3 min-w-0 md:w-72 md:shrink-0">
                    <span className="w-10 h-10 rounded-xl bg-marca-50 text-marca-600 font-bold flex items-center justify-center shrink-0 uppercase">
                      {c.nombre_empresa.slice(0, 2)}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-tinta-900 truncate">{c.nombre_empresa}</p>
                      <p className="text-xs text-slate-500 truncate">{c.nombre_contacto || 'Sin contacto'} · desde {formatoFecha(c.fecha_registro)}</p>
                    </div>
                  </div>

                  {/* Contacto: en celular cada dato abre la app correspondiente */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm min-w-0 flex-1">
                    <a href={`mailto:${c.correo_contacto}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-marca-600 min-w-0">
                      <IconoCorreo className="w-4 h-4 shrink-0 text-slate-400" /> <span className="truncate">{c.correo_contacto}</span>
                    </a>
                    {c.telefono && (
                      <a href={`tel:${c.telefono}`} className="inline-flex items-center gap-1.5 text-slate-600 hover:text-marca-600">
                        <IconoTelefono className="w-4 h-4 text-slate-400" /> {c.telefono}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center justify-between md:justify-end gap-2 md:shrink-0">
                    <Link href={`/admin/licencias?buscar=${encodeURIComponent(c.nombre_empresa)}`}>
                      <Insignia tono={total > 0 ? 'naranja' : 'gris'}>{total} {total === 1 ? 'licencia' : 'licencias'}</Insignia>
                    </Link>
                    <div className="flex gap-2">
                      {c.telefono && (
                        <a href={enlaceWhatsApp(c.telefono, `Hola ${c.nombre_contacto ?? ''}, te escribo de FitControl.`)} target="_blank" rel="noopener noreferrer"
                          aria-label="Escribir por WhatsApp" title="Escribir por WhatsApp"
                          className="inline-flex items-center justify-center w-9 h-9 rounded-lg border border-slate-200 bg-white text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 hover:border-emerald-200 transition">
                          <IconoWhatsApp className="w-4 h-4" />
                        </a>
                      )}
                      {puedeEditar && (
                        <>
                          <Link href={`/admin/licencias?cliente=${c.id}`} className={clasesBoton('secundario', 'sm', 'h-9')} title="Emitir licencia para este cliente">
                            <IconoLlave className="w-4 h-4" /> <span className="hidden sm:inline">Emitir licencia</span>
                          </Link>
                          <BotonIcono etiqueta="Editar cliente" onClick={() => setFormulario({ cliente: c })}><IconoLapiz className="w-4 h-4" /></BotonIcono>
                        </>
                      )}
                      {puedeBorrar && (
                        <BotonIcono etiqueta="Eliminar cliente" tono="peligro" onClick={() => eliminar(c)}><IconoBasura className="w-4 h-4" /></BotonIcono>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </Tarjeta>

      {formulario && (
        <FormularioCliente
          cliente={formulario.cliente}
          onCerrar={() => setFormulario(null)}
          onGuardado={(nuevo) => {
            setFormulario(null);
            avisar(nuevo ? 'Cliente registrado' : 'Cambios guardados');
            cargar();
          }}
        />
      )}
    </div>
  );
}

function FormularioCliente({ cliente, onCerrar, onGuardado }: { cliente?: Cliente; onCerrar: () => void; onGuardado: (nuevo: boolean) => void }) {
  const [empresa, setEmpresa] = useState(cliente?.nombre_empresa ?? '');
  const [contacto, setContacto] = useState(cliente?.nombre_contacto ?? '');
  const [correo, setCorreo] = useState(cliente?.correo_contacto ?? '');
  const [telefono, setTelefono] = useState(cliente?.telefono ?? '');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  const guardar = async (e: React.FormEvent) => {
    e.preventDefault();
    setGuardando(true);
    setError('');
    const datos = {
      nombre_empresa: empresa.trim(),
      nombre_contacto: contacto.trim() || null,
      correo_contacto: correo.trim().toLowerCase(),
      telefono: telefono.trim() || null,
    };
    const { error } = cliente
      ? await supabase.from('clientes').update(datos).eq('id', cliente.id)
      : await supabase.from('clientes').insert(datos);
    setGuardando(false);
    if (error) {
      setError(error.code === '23505' ? 'Ese correo ya está registrado en otro cliente.' : error.message);
      return;
    }
    onGuardado(!cliente);
  };

  return (
    <Modal
      abierto
      onCerrar={onCerrar}
      titulo={cliente ? 'Editar cliente' : 'Nuevo cliente'}
      pie={
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Boton variante="secundario" onClick={onCerrar} className="w-full sm:w-auto">Cancelar</Boton>
          <Boton type="submit" form="form-cliente" cargando={guardando} className="w-full sm:w-auto">{cliente ? 'Guardar cambios' : 'Registrar cliente'}</Boton>
        </div>
      }
    >
      <form id="form-cliente" onSubmit={guardar} className="space-y-5">
        {error && <Alerta>{error}</Alerta>}
        <Campo etiqueta="Nombre del establecimiento">
          {(id) => <Entrada id={id} required value={empresa} onChange={(e) => setEmpresa(e.target.value)} placeholder="Ej. Titan Training Center" autoComplete="organization" />}
        </Campo>
        <Campo etiqueta="Persona de contacto">
          {(id) => <Entrada id={id} value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="Ej. Laura Méndez" autoComplete="name" />}
        </Campo>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo etiqueta="Correo">
            {(id) => <Entrada id={id} type="email" required value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="contacto@negocio.com" autoComplete="email" inputMode="email" />}
          </Campo>
          <Campo etiqueta="Teléfono (WhatsApp)" ayuda="10 dígitos; se usa para enviarle la llave.">
            {(id) => <Entrada id={id} type="tel" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="33 1234 5678" autoComplete="tel" inputMode="tel" />}
          </Campo>
        </div>
      </form>
    </Modal>
  );
}
