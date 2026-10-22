'use client';

// Avisos (toasts) y diálogos de confirmación con el estilo de la marca.
// Sustituyen a alert() y confirm() del navegador, que se ven distintos en cada
// dispositivo y bloquean la página.
//
//   const { avisar, confirmar } = useAvisos();
//   avisar('Licencia renovada');
//   if (await confirmar({ titulo: '¿Eliminar?', peligro: true })) { ... }

import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Boton, Modal, cx } from './ui';
import { IconoAlerta, IconoCheck, IconoCerrar } from './iconos';

type TipoAviso = 'exito' | 'error' | 'info';
interface Aviso { id: number; texto: string; tipo: TipoAviso }

interface OpcionesConfirmar {
  titulo: string;
  mensaje?: ReactNode;
  textoConfirmar?: string;
  peligro?: boolean;
}

interface ContextoAvisos {
  avisar: (texto: string, tipo?: TipoAviso) => void;
  confirmar: (opciones: OpcionesConfirmar) => Promise<boolean>;
}

const Contexto = createContext<ContextoAvisos | null>(null);

export function useAvisos() {
  const ctx = useContext(Contexto);
  if (!ctx) throw new Error('useAvisos debe usarse dentro de <ProveedorAvisos>');
  return ctx;
}

export function ProveedorAvisos({ children }: { children: ReactNode }) {
  const [avisos, setAvisos] = useState<Aviso[]>([]);
  const [dialogo, setDialogo] = useState<OpcionesConfirmar | null>(null);
  const resolver = useRef<((v: boolean) => void) | null>(null);
  const siguienteId = useRef(0);

  const avisar = useCallback((texto: string, tipo: TipoAviso = 'exito') => {
    const id = ++siguienteId.current;
    setAvisos((prev) => [...prev, { id, texto, tipo }]);
    setTimeout(() => setAvisos((prev) => prev.filter((a) => a.id !== id)), tipo === 'error' ? 6000 : 3500);
  }, []);

  const confirmar = useCallback((opciones: OpcionesConfirmar) => {
    setDialogo(opciones);
    return new Promise<boolean>((resolve) => { resolver.current = resolve; });
  }, []);

  const responder = useCallback((valor: boolean) => {
    resolver.current?.(valor);
    resolver.current = null;
    setDialogo(null);
  }, []);

  const cancelar = useCallback(() => responder(false), [responder]);

  return (
    <Contexto.Provider value={{ avisar, confirmar }}>
      {children}

      {/* Pila de avisos: abajo al centro en celular (sobre la barra inferior), arriba a la derecha en escritorio */}
      <div aria-live="polite" className="fixed z-[60] inset-x-4 bottom-24 sm:bottom-auto sm:top-5 sm:right-5 sm:left-auto sm:w-96 flex flex-col gap-2 pointer-events-none">
        {avisos.map((a) => (
          <div
            key={a.id}
            role={a.tipo === 'error' ? 'alert' : 'status'}
            className={cx(
              'pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 shadow-lg ring-1 animate-subir text-sm',
              a.tipo === 'error' ? 'bg-white ring-rose-200 text-rose-700' : a.tipo === 'info' ? 'bg-white ring-slate-200 text-slate-700' : 'bg-tinta-900 ring-tinta-800 text-white',
            )}
          >
            <span className={cx('mt-0.5 shrink-0', a.tipo === 'exito' && 'text-emerald-400')}>
              {a.tipo === 'error' ? <IconoAlerta className="w-5 h-5" /> : <IconoCheck className="w-5 h-5" />}
            </span>
            <p className="flex-1">{a.texto}</p>
            <button type="button" aria-label="Cerrar aviso" onClick={() => setAvisos((p) => p.filter((x) => x.id !== a.id))} className="opacity-60 hover:opacity-100">
              <IconoCerrar className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      <Modal
        abierto={!!dialogo}
        onCerrar={cancelar}
        titulo={dialogo?.titulo ?? ''}
        ancho="sm"
        pie={
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
            <Boton variante="secundario" onClick={cancelar} className="w-full sm:w-auto">Cancelar</Boton>
            <Boton variante={dialogo?.peligro ? 'peligro' : 'primario'} onClick={() => responder(true)} className="w-full sm:w-auto" data-autofocus>
              {dialogo?.textoConfirmar ?? 'Confirmar'}
            </Boton>
          </div>
        }
      >
        <div className="text-sm text-slate-600 whitespace-pre-line">{dialogo?.mensaje}</div>
      </Modal>
    </Contexto.Provider>
  );
}
