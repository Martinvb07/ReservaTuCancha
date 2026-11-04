'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import FotoRemota from '@/components/ui/FotoRemota';
import { CITIES, getSport } from '@/lib/constants';
import { courtsApi } from '@/lib/api/courts.api';

interface Ciudad {
  nombre: string;
  total: number;
  foto: string;
}

/**
 * "Explora por ciudad": cada ciudad con cuántas canchas tiene, y al tocarla
 * el listado ya filtrado. El total sale de la API (una consulta chica por
 * ciudad); las ciudades sin canchas no se muestran.
 */
export default function ExploraCiudades() {
  const [ciudades, setCiudades] = useState<Ciudad[] | null>(null);

  useEffect(() => {
    let vivo = true;
    Promise.all(
      CITIES.map((nombre) =>
        courtsApi
          .getAll({ city: nombre, limit: 1 })
          .then((r): Ciudad => {
            const c = r.data?.[0];
            return { nombre, total: r.total ?? 0, foto: c?.photos?.[0] || getSport(c?.sport).img };
          })
          .catch((): Ciudad => ({ nombre, total: 0, foto: '' })),
      ),
    ).then((lista) => {
      if (vivo) setCiudades(lista.filter((c) => c.total > 0).sort((a, b) => b.total - a.total));
    });
    return () => {
      vivo = false;
    };
  }, []);

  if (ciudades && ciudades.length === 0) return null;

  return (
    <section className="mt-9 md:mt-12">
      <div className="flex items-center justify-between px-5">
        <h2 className="text-lg font-bold text-gray-900 md:text-2xl">Explora por ciudad</h2>
        <Link href="/empresas" className="py-1 text-sm font-medium text-gray-500 transition-colors hover:text-green-700">
          Ver todas
        </Link>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3 px-5 md:grid-cols-3 md:gap-4 lg:grid-cols-4">
        {ciudades === null
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-[28px] bg-white p-2">
                <div className="aspect-[4/3] rounded-[22px] bg-fondo-suave" />
                <div className="mx-2 my-3 h-4 w-2/3 rounded bg-fondo-suave" />
              </div>
            ))
          : ciudades.map((c) => (
              <Link
                key={c.nombre}
                href={`/empresas?city=${encodeURIComponent(c.nombre)}`}
                className="group rounded-[28px] bg-white p-2 transition-shadow hover:shadow-[0_14px_34px_rgba(17,24,39,0.08)] focus:outline-none focus-visible:ring-4 focus-visible:ring-green-500/30"
              >
                <div className="relative aspect-[4/3] overflow-hidden rounded-[22px] bg-gray-200">
                  {c.foto && (
                    <FotoRemota
                      src={c.foto}
                      alt={`Canchas en ${c.nombre}`}
                      sizes="(max-width: 768px) 50vw, 280px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </div>
                <div className="px-2 pb-1.5 pt-3">
                  <p className="flex items-center gap-1 truncate font-bold text-gray-900">
                    <MapPin className="h-4 w-4 shrink-0 text-green-600" /> {c.nombre}
                  </p>
                  <p className="mt-0.5 text-sm text-gray-500">
                    {c.total} {c.total === 1 ? 'cancha' : 'canchas'}
                  </p>
                </div>
              </Link>
            ))}
      </div>
    </section>
  );
}
