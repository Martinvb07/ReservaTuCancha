import { useSession, signIn, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) throw new Error('Credenciales inválidas');

    const role = (session?.user as any)?.role;
    router.push(role === 'admin' ? '/dashboard/admin' : '/dashboard/owner');
  };

  const logout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  return {
    user: session?.user,
    role: (session?.user as any)?.role,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
    login,
    logout,
  };
}
