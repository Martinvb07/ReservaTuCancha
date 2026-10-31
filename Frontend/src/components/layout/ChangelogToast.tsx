"use client";
import { useEffect } from "react";
import { toast } from "sonner";
import { BellRing, Sparkles, Zap, Bug, AlertCircle, Wrench, type LucideIcon } from "lucide-react";
import api from "@/lib/api/axios";
import type { Changelog } from "@/types/changelog.types";

const TAGS: Record<string, { label: string; color: string; bg: string; Icon: LucideIcon }> = {
  nueva_funcion:  { label: 'Nueva función',  color: 'text-blue-700',   bg: 'bg-blue-100',   Icon: Sparkles },
  mejora:         { label: 'Mejora',         color: 'text-purple-700', bg: 'bg-purple-100', Icon: Zap },
  correccion:     { label: 'Corrección',     color: 'text-orange-700', bg: 'bg-orange-100', Icon: Bug },
  importante:     { label: 'Importante',     color: 'text-red-700',    bg: 'bg-red-100',    Icon: AlertCircle },
  mantenimiento:  { label: 'Mantenimiento',  color: 'text-gray-700',   bg: 'bg-gray-100',   Icon: Wrench },
};

const STORAGE_KEY = "lastChangelogToast";
const ONE_DAY = 24 * 60 * 60 * 1000;

export default function ChangelogToast() {
  useEffect(() => {
    async function showChangelog() {
      try {
        const { data } = await api.get<Changelog[]>("/changelog");
        if (!data?.length) return;
        const last = data[0];
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const { id, ts } = JSON.parse(stored);
          if (id === last._id && Date.now() - ts < ONE_DAY) return;
        }
        toast.custom(
          (id) => (
            <div className="flex items-start gap-3 p-2">
              <span className="rounded-full bg-green-100 p-2 mt-1"><BellRing className="h-5 w-5 text-green-600" /></span>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full ${TAGS[last.tag]?.bg ?? ''} ${TAGS[last.tag]?.color ?? ''}`}>{TAGS[last.tag] && (() => { const { Icon } = TAGS[last.tag]; return <Icon className="h-3 w-3" />; })()}{TAGS[last.tag]?.label ?? ''}</span>
                  {last.version && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{last.version}</span>}
                </div>
                <div className="font-black text-gray-900 text-sm mb-0.5">{last.titulo}</div>
                <div className="text-xs text-gray-600 line-clamp-2 max-w-xs">{last.descripcion}</div>
              </div>
            </div>
          ),
          {
            duration: 9000,
            className: "shadow-2xl border border-green-200 bg-white/95",
            id: `changelog-${last._id}`,
          }
        );
        localStorage.setItem(STORAGE_KEY, JSON.stringify({ id: last._id, ts: Date.now() }));
      } catch {}
    }
    showChangelog();
  }, []);
  return null;
}
