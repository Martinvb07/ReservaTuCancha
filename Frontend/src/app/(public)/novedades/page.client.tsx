'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, useReducedMotion } from 'framer-motion';
import { format, formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { Rocket, Tag as TagIcon, Clock, Layers, Inbox, RefreshCw } from 'lucide-react';
import api from '@/lib/api/axios';
import FadeIn from '@/components/ui/FadeIn';
import {
  CHANGELOG_TAG_ORDER, CHANGELOG_TAGS, CHANGELOG_AUDIENCE, getChangelogTag, formatVersion,
} from '@/lib/changelogMeta';
import type { Changelog, ChangelogTag } from '@/types/changelog.types';

const EASE = [0.16, 1, 0.3, 1] as const;

function safeDate(value: string): Date | null {
  if (!value) return null;
  const d = parseISO(value);
  return isNaN(d.getTime()) ? null : d;
}

/* ── Chip del tag ───────────────────────────────────────────────── */
function TagChip({ tag }: { tag: string }) {
  const meta = getChangelogTag(tag);
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11.5px] font-bold ${meta.chip}`}>
      <meta.icon className="h-3.5 w-3.5 shrink-0" />
      {meta.label}
    </span>
  );
}

/* ── Tarjeta de una publicación ─────────────────────────────────── */
function EntryCard({ entry, latest }: { entry: Changelog; latest: boolean }) {
  const date = safeDate(entry.createdAt);
  const audience = CHANGELOG_AUDIENCE[entry.destinatarios];
  const version = formatVersion(entry.version);

  return (
    <article
      className={`rtc-card bg-white rounded-2xl border p-5 md:p-6 ${
        latest ? 'border-green-300 ring-1 ring-green-500/15' : 'border-gray-100'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <TagChip tag={entry.tag} />
        {version && (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-900 text-white text-[11.5px] font-bold tabular-nums">
            {version}
          </span>
        )}
        {latest && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-lime-400 text-gray-900 text-[11.5px] font-black uppercase tracking-wide">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-900 rtc-live" /> Último
          </span>
        )}
        {audience && (
          <span className="px-2.5 py-1 rounded-full bg-gray-50 border border-gray-200 text-gray-500 text-[11.5px] font-semibold">
            {audience}
          </span>
        )}
      </div>

      <h3 className="text-lg md:text-xl font-black text-gray-900 leading-tight">{entry.titulo}</h3>

      {date && (
        <p className="text-xs text-gray-400 mt-1.5 capitalize">
          {format(date, "d 'de' MMMM 'de' yyyy", { locale: es })}
        </p>
      )}

      <p className="text-[14.5px] text-gray-600 leading-relaxed whitespace-pre-line mt-3">
        {entry.descripcion}
      </p>
    </article>
  );
}

/* ── Tile de estadística del encabezado ─────────────────────────── */
function StatTile({ icon: Icon, value, label }: {
  icon: typeof Rocket; value: string; label: string;
}) {
  return (
    <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 backdrop-blur-sm">
      <span className="w-9 h-9 rounded-xl bg-lime-400/15 text-lime-400 grid place-items-center flex-none">
        <Icon className="h-[18px] w-[18px]" />
      </span>
      <div className="min-w-0">
        <p className="text-white font-black text-[15px] leading-tight truncate">{value}</p>
        <p className="text-gray-400 text-[11.5px] leading-tight">{label}</p>
      </div>
    </div>
  );
}

export default function NovedadesPageClient() {
  const reduce = useReducedMotion();
  const [activeTag, setActiveTag] = useState<ChangelogTag | 'todas'>('todas');

  const { data, isLoading, isError, refetch, isFetching } = useQuery<Changelog[]>({
    queryKey: ['changelog-public'],
    queryFn: async () => {
      const { data } = await api.get<Changelog[]>('/changelog');
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  const entries = useMemo(() => {
    /* El backend ya ordena por fecha desc, pero no dependemos de eso */
    return [...(data ?? [])].sort((a, b) => {
      const da = safeDate(a.createdAt)?.getTime() ?? 0;
      const db = safeDate(b.createdAt)?.getTime() ?? 0;
      return db - da;
    });
  }, [data]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const e of entries) map[e.tag] = (map[e.tag] ?? 0) + 1;
    return map;
  }, [entries]);

  const filtered = useMemo(
    () => (activeTag === 'todas' ? entries : entries.filter((e) => e.tag === activeTag)),
    [entries, activeTag],
  );

  /* Agrupadas por mes para que la línea de tiempo tenga hitos legibles */
  const groups = useMemo(() => {
    const map = new Map<string, Changelog[]>();
    for (const e of filtered) {
      const d = safeDate(e.createdAt);
      const key = d ? format(d, 'LLLL yyyy', { locale: es }) : 'Sin fecha';
      const arr = map.get(key);
      if (arr) arr.push(e);
      else map.set(key, [e]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const newestId = entries[0]?._id;
  const lastDate = safeDate(entries[0]?.createdAt ?? '');
  const lastVersion = formatVersion(entries.find((e) => e.version)?.version);

  /* Solo se ofrecen los filtros que tienen contenido */
  const availableTags = CHANGELOG_TAG_ORDER.filter((t) => counts[t] > 0);

  return (
    <main className="min-h-screen bg-gray-50">

      {/* ── ENCABEZADO ───────────────────────────────────────────── */}
      <section className="relative bg-gray-900">
        <div className="absolute inset-0 overflow-hidden">
          {/* Halos suaves: dan profundidad sin necesitar una imagen */}
          <div className="absolute -top-24 -left-16 w-80 h-80 rounded-full bg-green-500/20 blur-3xl" />
          <div className="absolute -bottom-32 right-0 w-96 h-96 rounded-full bg-lime-400/10 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto px-4 py-14 md:py-20">
          <p className="text-lime-400 font-semibold text-xs md:text-sm uppercase tracking-widest flex items-center gap-2 mb-3">
            <span>✦</span> Novedades
          </p>
          <h1 className="text-3xl md:text-5xl font-black text-white uppercase leading-[1.05]">
            Lo nuevo en <span className="text-lime-400">ReservaTuCancha</span>
          </h1>
          <p className="text-gray-300 mt-4 text-sm md:text-base max-w-2xl leading-relaxed">
            Cada mejora, corrección y función nueva que sale a producción, en orden.
            Así sabes exactamente qué cambió y cuándo.
          </p>

          {!isLoading && entries.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-8 max-w-2xl">
              <StatTile icon={Layers} value={`${entries.length} ${entries.length === 1 ? 'publicación' : 'publicaciones'}`} label="Historial completo" />
              <StatTile icon={TagIcon} value={lastVersion ?? '—'} label="Última versión" />
              <StatTile
                icon={Clock}
                value={lastDate ? formatDistanceToNow(lastDate, { locale: es, addSuffix: true }) : '—'}
                label="Última actualización"
              />
            </div>
          )}
        </div>
      </section>

      {/* ── CONTENIDO ────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 py-8 md:py-12">

        {/* Filtros por tipo */}
        {!isLoading && availableTags.length > 1 && (
          <div className="flex flex-wrap gap-2 mb-8 -mx-1 px-1">
            {(['todas', ...availableTags] as const).map((t) => {
              const isActive = t === activeTag;
              const meta = t === 'todas' ? null : CHANGELOG_TAGS[t as ChangelogTag];
              const count = t === 'todas' ? entries.length : counts[t];
              return (
                <motion.button
                  key={t}
                  type="button"
                  onClick={() => setActiveTag(t as ChangelogTag | 'todas')}
                  aria-pressed={isActive}
                  whileTap={reduce ? undefined : { scale: 0.96 }}
                  className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-full border text-[13px] font-bold transition-colors duration-200 ${
                    isActive ? 'border-green-600' : 'border-gray-200 bg-white hover:border-green-300'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="novedades-tag-pill"
                      className="absolute -inset-px rounded-full bg-green-600"
                      transition={reduce ? { duration: 0 } : { type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <span className={`relative z-10 flex items-center gap-1.5 ${isActive ? 'text-white' : 'text-gray-600'}`}>
                    {meta ? <meta.icon className="h-3.5 w-3.5" /> : <Rocket className="h-3.5 w-3.5" />}
                    {meta ? meta.label : 'Todas'}
                    <span className={`tabular-nums text-[11px] ${isActive ? 'text-white/70' : 'text-gray-400'}`}>{count}</span>
                  </span>
                </motion.button>
              );
            })}
          </div>
        )}

        {/* Cargando */}
        {isLoading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 animate-pulse">
                <div className="flex gap-2 mb-4">
                  <div className="h-6 w-28 bg-gray-100 rounded-full" />
                  <div className="h-6 w-14 bg-gray-100 rounded-full" />
                </div>
                <div className="h-5 bg-gray-200 rounded w-2/3 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-full mb-2" />
                <div className="h-3 bg-gray-100 rounded w-4/5" />
              </div>
            ))}
          </div>
        )}

        {/* Error */}
        {isError && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <p className="text-lg font-black text-gray-900 uppercase">No pudimos cargar las novedades</p>
            <p className="text-gray-500 text-sm mt-2">Revisa tu conexión e inténtalo de nuevo.</p>
            <button
              type="button"
              onClick={() => refetch()}
              disabled={isFetching}
              className="inline-flex items-center gap-2 mt-5 bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 rounded-xl transition-colors"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Reintentar
            </button>
          </div>
        )}

        {/* Vacío */}
        {!isLoading && !isError && filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
            <span className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-300 grid place-items-center mx-auto mb-4">
              <Inbox className="h-7 w-7" />
            </span>
            <p className="text-lg font-black text-gray-900 uppercase">
              {entries.length === 0 ? 'Todavía no hay novedades' : 'Nada en esta categoría'}
            </p>
            <p className="text-gray-500 text-sm mt-2">
              {entries.length === 0
                ? 'Cuando publiquemos la primera actualización, aparecerá acá.'
                : 'Prueba con otro tipo de cambio.'}
            </p>
          </div>
        )}

        {/* Línea de tiempo. El key por tag hace que la lista vuelva a entrar
            escalonada al cambiar de filtro. */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div key={activeTag} className="space-y-10">
            {groups.map(([month, items], gi) => (
              <div key={month}>
                <FadeIn delay={gi * 60}>
                  <h2 className="text-[11px] font-black uppercase tracking-[.16em] text-gray-400 mb-4 capitalize">
                    {month}
                  </h2>
                </FadeIn>

                {/* Rail vertical + tarjetas */}
                <ol className="relative pl-7 md:pl-9">
                  <span
                    aria-hidden
                    className="absolute left-[7px] md:left-[9px] top-1.5 bottom-1.5 w-px bg-gradient-to-b from-green-300 via-gray-200 to-transparent"
                  />
                  {items.map((entry, i) => {
                    const meta = getChangelogTag(entry.tag);
                    return (
                      <motion.li
                        key={entry._id}
                        className="relative pb-4 last:pb-0"
                        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: reduce ? 0.15 : 0.5,
                          delay: reduce ? 0 : Math.min(i, 6) * 0.06,
                          ease: EASE,
                        }}
                      >
                        {/* Punto en el rail, alineado con el chip del tag */}
                        <span
                          aria-hidden
                          className={`absolute -left-7 md:-left-9 top-6 w-[15px] h-[15px] rounded-full border-[3px] border-gray-50 ${meta.dot}`}
                          style={{ boxShadow: `0 0 0 4px ${meta.glow}` }}
                        />
                        <EntryCard entry={entry} latest={entry._id === newestId} />
                      </motion.li>
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
