// src/modules/changelog/version.util.ts
//
// Manejo de versiones del changelog. El historial venía con formatos mezclados
// ("v1.0.1", "2.0.0", "2.1"), así que todo se normaliza a X.Y.Z antes de
// comparar: si no, "2.1" parecería mayor que "2.1.1" al ordenar como texto.

export interface SemVer {
  major: number;
  minor: number;
  patch: number;
}

/** Acepta "2", "2.1", "2.1.3" y "v2.1.3" (con o sin espacios). */
const VERSION_RE = /^v?\s*(\d{1,4})(?:\.(\d{1,4}))?(?:\.(\d{1,4}))?$/i;

export function parseVersion(raw?: string | null): SemVer | null {
  const match = VERSION_RE.exec((raw ?? '').trim());
  if (!match) return null;
  return {
    major: Number(match[1]),
    minor: Number(match[2] ?? 0),
    patch: Number(match[3] ?? 0),
  };
}

export function formatVersion(v: SemVer): string {
  return `${v.major}.${v.minor}.${v.patch}`;
}

/** "2.1" → "2.1.0". `null` si el texto no es una versión válida. */
export function normalizeVersion(raw?: string | null): string | null {
  const parsed = parseVersion(raw);
  return parsed ? formatVersion(parsed) : null;
}

/** Negativo si a < b, cero si son iguales, positivo si a > b. */
export function compareVersions(a: SemVer, b: SemVer): number {
  return a.major - b.major || a.minor - b.minor || a.patch - b.patch;
}

/** La versión más alta de una lista; ignora las entradas sin versión. */
export function highestVersion(list: (string | undefined | null)[]): SemVer | null {
  return list.reduce<SemVer | null>((max, raw) => {
    const parsed = parseVersion(raw);
    if (!parsed) return max;
    return !max || compareVersions(parsed, max) > 0 ? parsed : max;
  }, null);
}

/** Cuánto sube la versión: el segundo número o el tercero. */
export type BumpKind = 'minor' | 'patch';

/**
 * Qué salto le corresponde a cada tipo de cambio.
 * Algo que antes no existía (o que exige atención) mueve el minor; pulir,
 * arreglar o mantener mueve solo el patch.
 */
export const TAG_BUMP: Record<string, BumpKind> = {
  nueva_funcion: 'minor',
  importante:    'minor',
  mejora:        'patch',
  correccion:    'patch',
  mantenimiento: 'patch',
};

/** Siguiente versión a partir de la última publicada. Sin historial: 1.0.0. */
export function bumpVersion(from: SemVer | null, kind: BumpKind): string {
  if (!from) return '1.0.0';
  return kind === 'minor'
    ? formatVersion({ major: from.major, minor: from.minor + 1, patch: 0 })
    : formatVersion({ major: from.major, minor: from.minor, patch: from.patch + 1 });
}
