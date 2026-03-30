// src/components/layout/ChangelogFloatingButton.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { BellRing } from "lucide-react";
import api from "@/lib/api/axios";
import type { Changelog } from "@/types/changelog.types";

const TAGS: Record<string, { label: string; color: string; bg: string }> = {
  nueva_funcion:  { label: '✨ Nueva función',  color: 'text-blue-700',   bg: 'bg-blue-100'   },
  mejora:         { label: '⚡ Mejora',          color: 'text-purple-700', bg: 'bg-purple-100' },
  correccion:     { label: '🐛 Corrección',      color: 'text-orange-700', bg: 'bg-orange-100' },
  importante:     { label: '🔴 Importante',      color: 'text-red-700',    bg: 'bg-red-100'    },
  mantenimiento:  { label: '🔧 Mantenimiento',   color: 'text-gray-700',   bg: 'bg-gray-100'   },
};

const STORAGE_KEY = "lastChangelogSeen";

export default function ChangelogFloatingButton() {
  const [open, setOpen] = useState(false);
  const [last, setLast] = useState<Changelog | null>(null);
  const [unseen, setUnseen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Cargar datos del Changelog
  useEffect(() => {
    api.get<Changelog[]>("/changelog").then(({ data }) => {
      if (data?.length) {
        setLast(data[0]);
        const seenId = localStorage.getItem(STORAGE_KEY);
        setUnseen(data[0]._id !== seenId);
      }
    });
  }, []);

  // Cerrar al hacer click fuera del modal
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Marcar como visto al abrir el modal
  useEffect(() => {
    if (open && last) {
      localStorage.setItem(STORAGE_KEY, last._id);
      setUnseen(false);
    }
  }, [open, last]);

  return (
    <div className="relative">
      {/* Botón Flotante */}
      <button
        aria-label="Ver novedades"
        onClick={() => setOpen((v) => !v)}
        className="
          fixed bottom-24 right-6 z-50 
          bg-white shadow-xl hover:shadow-2xl 
          border border-green-200 text-green-600 
          rounded-full transition-all group
          /* TAMAÑO FIJO E IGUAL AL DE WHATSAPP (56px) */
          h-14 w-14 
          flex items-center justify-center
        "
        style={{ boxShadow: "0 4px 24px 0 #00e67622" }}
      >
        {/* Icono centrado con tamaño h-7 (28px) */}
        <BellRing className="h-7 w-7 group-hover:animate-bounce shrink-0" />
        
        {/* Indicador de "No leído" */}
        {unseen && (
          <span className="
            absolute top-3.5 right-3.5 
            block h-3.5 w-3.5 
            rounded-full bg-red-500 
            border-2 border-white animate-pulse
          " />
        )}
      </button>

      {/* Modal de Novedades */}
      {open && last && (
        <div
          ref={ref}
          className="
            fixed bottom-40 right-6 z-50 
            bg-white border border-green-200 
            rounded-2xl shadow-2xl p-5 w-80 
            animate-in fade-in slide-in-from-bottom-4 duration-300
          "
        >
          {/* Tags de Versión y Categoría */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`
              text-[10px] uppercase tracking-wider font-black px-2.5 py-1 rounded-full 
              ${TAGS[last.tag]?.bg ?? 'bg-gray-100'} 
              ${TAGS[last.tag]?.color ?? 'text-gray-700'}
            `}>
              {TAGS[last.tag]?.label ?? 'Novedad'}
            </span>
            {last.version && (
              <span className="text-[10px] font-bold text-gray-400 bg-gray-50 border border-gray-100 px-2 py-1 rounded-full">
                v{last.version}
              </span>
            )}
          </div>

          {/* Contenido */}
          <div className="font-black text-gray-900 text-lg mb-1 leading-tight">
            {last.titulo}
          </div>
          <div className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">
            {last.descripcion}
          </div>

          {/* Flecha decorativa hacia el botón (opcional) */}
          <div className="absolute -bottom-2 right-6 w-4 h-4 bg-white border-r border-b border-green-200 rotate-45" />
        </div>
      )}
    </div>
  );
}