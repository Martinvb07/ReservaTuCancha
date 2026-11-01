import Image from 'next/image';

/* Los hosts que next.config.mjs deja optimizar. Una URL de otro dominio con
   next/image rompe la página entera, así que esas van con <img> normal. */
const OPTIMIZABLES = ['res.cloudinary.com', 'images.unsplash.com'];

function optimizable(src: string) {
  try {
    return OPTIMIZABLES.includes(new URL(src).hostname);
  } catch {
    return src.startsWith('/');
  }
}

/**
 * Foto que llena su contenedor (que tiene que ser `relative` y tener alto).
 * Las de Cloudinary y Unsplash salen redimensionadas al tamaño de pantalla y
 * en WebP/AVIF, con carga diferida; el resto se pinta tal cual.
 */
export default function FotoRemota({
  src, alt, className = '', sizes = '100vw', priority = false,
}: { src: string; alt: string; className?: string; sizes?: string; priority?: boolean }) {
  if (!optimizable(src)) {
    return <img src={src} alt={alt} loading={priority ? 'eager' : 'lazy'} className={`absolute inset-0 w-full h-full ${className}`} />;
  }
  return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
}
