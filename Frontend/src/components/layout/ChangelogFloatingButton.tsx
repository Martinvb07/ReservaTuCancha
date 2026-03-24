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

  useEffect(() => {
    api.get<Changelog[]>("/changelog").then(({ data }) => {
      if (data?.length) {
        setLast(data[0]);
        const seenId = localStorage.getItem(STORAGE_KEY);
        setUnseen(data[0]._id !== seenId);
      }
    });
  }, []);

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return;
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, [open]);

  // Marcar como visto al abrir
  useEffect(() => {
    if (open && last) {
      localStorage.setItem(STORAGE_KEY, last._id);
      setUnseen(false);
    }
  }, [open, last]);

  return (
    <div>
      <button
        aria-label="Ver novedades"
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-24 right-6 z-50 bg-white shadow-xl hover:shadow-2xl border border-green-200 text-green-600 rounded-full p-3 transition-all group"
        style={{ boxShadow: "0 4px 24px 0 #00e67622" }}
      >
        <BellRing className="h-6 w-6 group-hover:animate-bounce" />
        {unseen && (
          <span className="absolute top-2 right-2 block h-3 w-3 rounded-full bg-red-500 border-2 border-white animate-pulse" />
        )}
      </button>
      {open && last && (
        <div
          ref={ref}
          className="fixed bottom-32 right-6 z-50 bg-white border border-green-200 rounded-2xl shadow-2xl p-4 w-80 animate-fade-in"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${TAGS[last.tag]?.bg ?? ''} ${TAGS[last.tag]?.color ?? ''}`}>{TAGS[last.tag]?.label ?? ''}</span>
            {last.version && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{last.version}</span>}
          </div>
          <div className="font-black text-gray-900 text-base mb-1">{last.titulo}</div>
          <div className="text-sm text-gray-600 whitespace-pre-line mb-2">{last.descripcion}</div>
        </div>
      )}
    </div>
  );
}
