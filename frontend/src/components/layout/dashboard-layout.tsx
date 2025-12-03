'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';
import { Toaster } from '@/components/ui/sonner';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading

    if (!session) {
      router.push('/auth/signin');
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <div className="flex-1 lg:ml-0">
        <Topbar />
        <main className="p-6 bg-background">
          {children}
        </main>
      </div>
      <div className="fixed top-0 right-0 z-[9999]">
        <Toaster />
      </div>
    </div>
  );
}
