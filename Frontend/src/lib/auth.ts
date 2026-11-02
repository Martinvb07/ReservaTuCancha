import type { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';

// URL del backend NestJS para llamadas internas server-side (no depende de NEXTAUTH_URL).
// En prod/dev el backend corre en el mismo host que Next.
const BACKEND_INTERNAL_URL = process.env.BACKEND_INTERNAL_URL || 'http://127.0.0.1:4000';

/**
 * El IP de quien esta intentando entrar.
 *
 * Next llama al backend desde el mismo servidor, asi que sin reenviar esto
 * todos los logins le llegan a Nest desde 127.0.0.1 y su limite por IP no
 * frena nada: un atacante y un vecino cuentan como el mismo cliente.
 */
function ipDelCliente(req: any): string | undefined {
  const reenviado = req?.headers?.['x-forwarded-for'];
  const crudo = Array.isArray(reenviado) ? reenviado[0] : reenviado;
  const primero = typeof crudo === 'string' ? crudo.split(',')[0]?.trim() : undefined;
  return primero || req?.headers?.['x-real-ip'] || undefined;
}

async function refreshAccessToken(token: any) {
  try {
    const res = await fetch(`${BACKEND_INTERNAL_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: token.refreshToken }),
    });

    if (!res.ok) throw new Error('Refresh failed');

    const data = await res.json();
    return {
      ...token,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      accessTokenExpires: Date.now() + 14 * 60 * 1000, // 14 min (refresh before 15min expiry)
    };
  } catch {
    return { ...token, error: 'RefreshAccessTokenError' };
  }
}

/** Lo que el backend devuelve al abrir sesión, en la forma que guarda next-auth. */
function usuarioDeSesion(data: any) {
  return {
    id: data.user.id,
    name: data.user.name,
    email: data.user.email,
    role: data.user.role,
    esStaff: !!data.user.esStaff,
    debeCambiarClave: !!data.user.debeCambiarClave,
    avatarUrl: data.user.avatarUrl,
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
  };
}

/* Entrar con Google: solo si están las credenciales del cliente OAuth. El
   backend verifica el ID token y abre la sesión de la cuenta con ese correo;
   no crea cuentas nuevas. */
const googleProvider = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
  ? [GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    })]
  : [];

export const authOptions: NextAuthOptions = {
  providers: [
    ...googleProvider,
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Contrasena', type: 'password' },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${BACKEND_INTERNAL_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...(ipDelCliente(req) ? { 'x-forwarded-for': ipDelCliente(req)! } : {}),
            },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();
          if (!res.ok) return null;

          return {
            id: data.user.id,
            name: data.user.name,
            email: data.user.email,
            role: data.user.role,
            /* Empleado del club: usa el panel del dueño sin pagos ni equipo. */
            esStaff: !!data.user.esStaff,
            debeCambiarClave: !!data.user.debeCambiarClave,
            avatarUrl: data.user.avatarUrl,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
          } as any;
        } catch {
          return null;
        }
      },
    }),
  ],
  callbacks: {
    /* Con Google, el ID token se canjea en el backend por la sesión del
       panel. Si el correo no tiene cuenta, se vuelve al login con el aviso. */
    async signIn({ account, user }: any) {
      if (account?.provider !== 'google') return true;
      try {
        const res = await fetch(`${BACKEND_INTERNAL_URL}/api/cuenta/google`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken: account.id_token }),
        });
        if (!res.ok) return '/auth/login?error=google';
        Object.assign(user, usuarioDeSesion(await res.json()));
        return true;
      } catch {
        return '/auth/login?error=google';
      }
    },
    async jwt({ token, user, trigger, session: cambios }: any) {
      /* Después de cambiar la clave el panel avisa con update(): deja de
         pedir el cambio sin cerrar la sesión. */
      if (trigger === 'update' && cambios?.debeCambiarClave === false) {
        token.debeCambiarClave = false;
      }
      // Login inicial: guardar tokens
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.esStaff = !!user.esStaff;
        token.debeCambiarClave = !!user.debeCambiarClave;
        token.avatarUrl = user.avatarUrl;
        token.accessToken = user.accessToken;
        token.refreshToken = user.refreshToken;
        token.accessTokenExpires = Date.now() + 14 * 60 * 1000; // 14 min
        return token;
      }

      // Token aún vigente
      if (Date.now() < (token.accessTokenExpires as number)) {
        return token;
      }

      // Token expirado: intentar refresh
      return refreshAccessToken(token);
    },
    async session({ session, token }: any) {
      if (session.user) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.esStaff = !!token.esStaff;
        session.user.debeCambiarClave = !!token.debeCambiarClave;
        session.user.avatarUrl = token.avatarUrl;
      }
      session.accessToken = token.accessToken;
      session.error = token.error;
      return session;
    },
  },
  pages: {
    signIn: '/auth/login',
    error: '/auth/login',
    signOut: '/auth/login',
  },
  session: { strategy: 'jwt', maxAge: 7 * 24 * 60 * 60 }, // 7 días (tied to refresh token)
  secret: process.env.NEXTAUTH_SECRET,
};
