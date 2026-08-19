// src/components/layout/SupportChat.tsx
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bot, ChevronRight, ExternalLink, RotateCcw, X } from 'lucide-react';
import treeData from '@/data/supportBot.json';
import type {
  SupportBotMensaje,
  SupportBotOpcion,
  SupportBotTree,
} from '@/types/supportBot.types';

const tree = treeData as SupportBotTree;

const WHATSAPP_URL =
  'https://wa.me/573124352786?text=Hola%2C%20vengo%20del%20asistente%20de%20ReservaTuCancha%20y%20necesito%20ayuda';

/* Coreografía de un turno (ms). Cada paso encadena con el anterior para que
   nada aparezca ni desaparezca de golpe. */
const CIERRE_PANEL   = 220;  // debe coincidir con .rtc-chat-out
const SALIDA_CHIPS   = 170;  // debe coincidir con .rtc-chat-chip-out
const ESCRITURA      = 620;  // puntitos antes de la respuesta del bot
const ARRANQUE_SALUDO = 320; // aire entre el saludo y el primer menú

let contador = 0;
const nuevoId = () => `m${++contador}`;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Evento con el que cualquier página pide abrir el asistente. */
export const ABRIR_SOPORTE = 'rtc:abrir-soporte';

export default function SupportChat({ open, onOpenChange }: Props) {
  const router = useRouter();

  const [montado, setMontado]         = useState(false);
  const [cerrando, setCerrando]       = useState(false);
  const [mensajes, setMensajes]       = useState<SupportBotMensaje[]>([]);
  const [opciones, setOpciones]       = useState<SupportBotOpcion[]>([]);
  const [turno, setTurno]             = useState(0);
  const [chipsSaliendo, setChipsSaliendo] = useState(false);
  const [escribiendo, setEscribiendo] = useState(false);
  /** Último menú visitado: a él vuelve "Ver otro tema". */
  const menuActualRef = useRef<string>(tree.meta.nodoInicial);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timers    = useRef<ReturnType<typeof setTimeout>[]>([]);

  const programar = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  const limpiarTimers = useCallback(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
  }, []);

  /* ── Motor del árbol ─────────────────────────────────────────────── */

  const irANodo = useCallback((idNodo: string, retraso = 0) => {
    const nodo = tree.nodos[idNodo];
    if (!nodo) return;

    /* La primera pantalla lista los temas (reservas, pagos, clubes, cuenta) y
       cada uno abre su propio menú. Al terminar una respuesta, "Ver otro tema"
       debe devolver a ese submenú y no al arranque, así que se recuerda cuál
       fue el último menú por el que pasó. */
    if (idNodo.startsWith('menu-')) menuActualRef.current = idNodo;

    programar(() => {
      setEscribiendo(true);
      programar(() => {
        setEscribiendo(false);
        setChipsSaliendo(false);
        setMensajes(prev => [...prev, { id: nuevoId(), autor: 'bot', texto: nodo.mensaje }]);
        setOpciones(
          nodo.esRespuesta
            ? [
                ...nodo.opciones,
                ...tree.meta.opcionesFinales.map((o) =>
                  o.destino === 'inicio' ? { ...o, destino: menuActualRef.current } : o,
                ),
              ]
            : nodo.opciones,
        );
        setTurno(t => t + 1);
      }, ESCRITURA);
    }, retraso);
  }, [programar]);

  const reiniciar = useCallback(() => {
    limpiarTimers();
    setEscribiendo(false);
    setChipsSaliendo(false);
    setOpciones([]);
    setMensajes([{ id: nuevoId(), autor: 'bot', texto: tree.meta.saludo }]);
    irANodo(tree.meta.nodoInicial, ARRANQUE_SALUDO);
  }, [irANodo, limpiarTimers]);

  const elegirOpcion = (opcion: SupportBotOpcion) => {
    // Mientras el bot "escribe" o los chips salen, los clicks se ignoran:
    // encadenar turnos a medias es justo lo que se siente tosco.
    if (escribiendo || chipsSaliendo) return;

    setMensajes(prev => [...prev, { id: nuevoId(), autor: 'usuario', texto: opcion.texto }]);

    if (opcion.accion === 'whatsapp') {
      window.open(WHATSAPP_URL, '_blank', 'noopener,noreferrer');
      return;
    }

    if (opcion.url) {
      if (opcion.url.startsWith('/')) {
        onOpenChange(false);
        programar(() => router.push(opcion.url!), CIERRE_PANEL);
      } else {
        window.open(opcion.url, '_blank', 'noopener,noreferrer');
      }
      return;
    }

    if (!opcion.destino) return;

    setChipsSaliendo(true);
    programar(() => setOpciones([]), SALIDA_CHIPS);
    irANodo(opcion.destino, SALIDA_CHIPS);
  };

  /* ── Ciclo de vida ───────────────────────────────────────────────── */

  // El panel sobrevive al cierre lo justo para que corra su animación de salida.
  useEffect(() => {
    if (open) {
      setMontado(true);
      setCerrando(false);
      return;
    }
    if (!montado) return;
    setCerrando(true);
    const t = setTimeout(() => {
      setMontado(false);
      setCerrando(false);
    }, CIERRE_PANEL);
    return () => clearTimeout(t);
  }, [open, montado]);

  // La conversación arranca la primera vez que se abre y se conserva al cerrar.
  useEffect(() => {
    if (open && mensajes.length === 0) reiniciar();
  }, [open, mensajes.length, reiniciar]);

  useEffect(() => limpiarTimers, [limpiarTimers]);

  // En móvil el panel ocupa casi toda la pantalla, así que se bloquea el scroll
  // del fondo como hacen los demás sheets. En tablet/escritorio es un widget de
  // esquina y bloquearlo sería un error.
  useEffect(() => {
    if (!montado || !window.matchMedia('(max-width: 639px)').matches) return;
    const previo = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previo; };
  }, [montado]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onOpenChange(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onOpenChange]);

  // Se hace tras el pintado para que la altura ya incluya lo recién montado.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      const caja = scrollRef.current;
      if (caja) caja.scrollTo({ top: caja.scrollHeight, behavior: 'smooth' });
    });
    return () => cancelAnimationFrame(id);
  }, [mensajes, opciones, escribiendo, montado]);

  /* ── Render ──────────────────────────────────────────────────────── */

  return (
    <>
      {/* El FAB no se desmonta: se encoge y se desvanece hacia el panel. */}
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        tabIndex={open ? -1 : 0}
        aria-hidden={open}
        style={{
          transition:
            'width .5s cubic-bezier(.16,1,.3,1), background-color .3s ease, ' +
            'opacity .22s ease, transform .32s cubic-bezier(.16,1,.3,1)',
        }}
        className={`
          fab-float fab-expand
          fixed bottom-24 right-6 z-50
          flex items-center overflow-hidden rounded-full
          bg-gray-900 hover:bg-gray-800
          text-lime-400 shadow-xl hover:shadow-2xl
          group h-14 w-14
          ${open
            ? 'pointer-events-none scale-50 opacity-0'
            : 'scale-100 opacity-100 active:scale-95'}
        `}
        aria-label="Abrir asistente de soporte"
      >
        <span className="flex h-14 w-14 shrink-0 items-center justify-center">
          <Bot className="h-7 w-7" />
        </span>
        <span className="
          fab-expand-label
          max-w-0 whitespace-nowrap pr-6 text-sm font-bold text-white opacity-0
          transition-all duration-500 ease-in-out
        ">
          Asistente virtual
        </span>
      </button>

      {montado && (
        <div
          role="dialog"
          aria-label={tree.meta.titulo}
          className={`
            fixed z-50 flex flex-col overflow-hidden
            border border-gray-100 bg-white shadow-2xl
            inset-x-4 bottom-4 top-20 rounded-3xl
            sm:inset-x-auto sm:top-auto sm:bottom-6 sm:right-6
            sm:h-[580px] sm:max-h-[calc(100vh-6rem)] sm:w-[380px]
            ${cerrando ? 'rtc-chat-out' : 'rtc-chat-in'}
          `}
        >
          {/* Encabezado */}
          <header className="flex items-center gap-3 bg-gray-900 px-5 py-4 text-white">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime-400 text-gray-900">
              <Bot className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-black uppercase tracking-wide">{tree.meta.titulo}</p>
              <p className="flex items-center gap-1.5 text-xs text-gray-400">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                {tree.meta.subtitulo}
              </p>
            </div>
            <button
              type="button"
              onClick={reiniciar}
              className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-90"
              aria-label="Reiniciar conversación"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="rounded-full p-2 text-gray-400 transition-all duration-200 hover:bg-white/10 hover:text-white active:scale-90"
              aria-label="Cerrar asistente"
            >
              <X className="h-5 w-5" />
            </button>
          </header>

          {/* Conversación */}
          <div
            ref={scrollRef}
            className="rtc-chat-scroll flex-1 space-y-3 overflow-y-auto overscroll-contain bg-gray-50 px-4 py-5"
          >
            {mensajes.map(m => (
              <div
                key={m.id}
                className={`rtc-chat-bubble flex ${m.autor === 'bot' ? 'justify-start' : 'justify-end'}`}
              >
                <p
                  className={
                    m.autor === 'bot'
                      ? 'max-w-[85%] whitespace-pre-line rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3 text-sm leading-relaxed text-gray-700 shadow-sm'
                      : 'max-w-[85%] rounded-2xl rounded-tr-sm bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white'
                  }
                >
                  {m.texto}
                </p>
              </div>
            ))}

            {escribiendo && (
              <div className="rtc-chat-bubble flex justify-start" aria-label="Escribiendo">
                <span className="flex items-center gap-1 rounded-2xl rounded-tl-sm border border-gray-100 bg-white px-4 py-3.5 shadow-sm">
                  {[0, 1, 2].map(i => (
                    <span
                      key={i}
                      className="rtc-chat-typing h-1.5 w-1.5 rounded-full bg-gray-500"
                      style={{ animationDelay: `${i * 0.16}s` }}
                    />
                  ))}
                </span>
              </div>
            )}

            {/* Opciones del nodo actual. La key por turno fuerza el remonte para
                que la entrada escalonada se vuelva a reproducir. */}
            {opciones.length > 0 && (
              <div key={turno} className="flex flex-col items-end gap-2 pt-1">
                {opciones.map((opcion, i) => (
                  <button
                    key={opcion.texto}
                    type="button"
                    onClick={() => elegirOpcion(opcion)}
                    style={{
                      animationDelay: chipsSaliendo ? `${i * 22}ms` : `${i * 55}ms`,
                    }}
                    className={`
                      group flex max-w-[90%] items-center gap-1.5 rounded-full
                      border border-gray-200 bg-white px-4 py-2
                      text-left text-sm font-semibold text-gray-700 shadow-sm
                      transition-[background-color,border-color,color,transform] duration-200
                      hover:border-lime-400 hover:bg-lime-50 hover:text-gray-900
                      active:scale-[0.97]
                      ${chipsSaliendo ? 'rtc-chat-chip-out' : 'rtc-chat-chip'}
                    `}
                  >
                    {opcion.texto}
                    {opcion.url && !opcion.url.startsWith('/') ? (
                      <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-colors group-hover:text-lime-600" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-lime-600" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Pie */}
          <footer className="border-t border-gray-100 bg-white px-4 py-3">
            <p className="text-center text-[11px] leading-relaxed text-gray-400">
              ¿Prefieres hablar con una persona?{' '}
              <a
                href={WHATSAPP_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-green-600 transition-colors hover:text-green-700 hover:underline"
              >
                Escríbenos por WhatsApp
              </a>
            </p>
          </footer>
        </div>
      )}
    </>
  );
}
