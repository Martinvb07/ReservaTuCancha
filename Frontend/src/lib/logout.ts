import { signOut } from 'next-auth/react';

/**
 * Cierra la sesión y navega dentro del origen actual.
 *
 * No usa `callbackUrl` a propósito: NextAuth lo resuelve contra `NEXTAUTH_URL`
 * (su callback `redirect` por defecto hace `baseUrl + url`), así que si esa
 * variable apunta a otro host —por ejemplo si quedó en localhost— el logout
 * saca al usuario del sitio. Con `redirect: false` la navegación la hacemos
 * nosotros y siempre es relativa al dominio donde está el usuario.
 */
export async function logout(to = '/') {
  await signOut({ redirect: false });
  if (typeof window !== 'undefined') window.location.href = to;
}
