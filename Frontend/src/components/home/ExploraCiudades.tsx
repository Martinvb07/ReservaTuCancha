'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { MapPin } from 'lucide-react';
import { CITIES, getSport } from '@/lib/constants';
import { courtsApi } from '@/lib/api/courts.api';

/* Foto representativa de cada ciudad (las eligió el dueño del sitio). Van
   enlazadas a su página de origen: si alguna deja de cargar, la tarjeta cae
   sola a la foto de una cancha de esa ciudad. */
const FOTO_CIUDAD: Record<string, string> = {
  Villavicencio: 'https://maravillasdelguejar.com/wp-content/uploads/2025/10/Pueblos-cerca-a-Villavicencio-para-visitar.jpg',
  'Acacías': 'https://www.colombiaturismo.com.co/img/acacias-meta-colombia.jpg',
  Cali: 'https://www.cali.gov.co/info/caligovco_se/media/pubInt/thumbs/thpubInt_700X400_186322.webp',
  Bucaramanga: 'https://blog.redbus.co/wp-content/uploads/2018/06/Proyecto-nuevo-2025-02-28T151508.383.jpg',
  Restrepo: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcToPKTyyngReVY6fruHyFUtg1tXyR6Ny3kwa_wU2uuJTTk4uXomXskJrkw&s=10',
  'Bogotá': 'https://cdn1.matadornetwork.com/blogs/2/2016/02/Bogota-Colombia-cityscape-1200x853.jpeg',
  'Medellín': 'https://cdn.forbes.co/2020/09/Medell%C3%ADn-foto-ProColombia.jpg',
  Barranquilla: 'https://www.semana.com/resizer/v2/BATZAH5PDZHTJEX7LDBHQMMQMI.jpg?auth=11b49f69af6153b773529b1cb27e2ec0df3b0f29c251d4a22d9b2aca59ff2679',
};

/** Foto de la ciudad; si no carga, la de una cancha de ahí. */
function FotoCiudad({ ciudad, respaldo }: { ciudad: string; respaldo: string }) {
  const propia = FOTO_CIUDAD[ciudad];
  const [src, setSrc] = useState(propia || respaldo);
  if (!src) return null;
  return (
    <img
      src={src}
      alt={`Canchas en ${ciudad}`}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (src !== respaldo && respaldo) setSrc(respaldo);
      }}
      className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
    />
  );
}

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
                  <FotoCiudad ciudad={c.nombre} respaldo={c.foto} />
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
