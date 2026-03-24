"use client";
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

import DashboardShell from '@/components/layout/DashboardShell';
import ChangelogFloatingButton from '@/components/layout/ChangelogFloatingButton';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === "loading") return (
    <div className="flex h-screen items-center justify-center bg-gray-900">
      <div className="w-8 h-8 border-4 border-lime-400 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!session) {
    router.replace("/auth/login");
    return null;
  }

  const role = (session.user as any).role;
  return (
    <DashboardShell
      sidebarRole={role}
      sidebarUserName={session.user?.name ?? ''}
    >
      {children}
      {role === 'owner' && <ChangelogFloatingButton />}
    </DashboardShell>
  );
}