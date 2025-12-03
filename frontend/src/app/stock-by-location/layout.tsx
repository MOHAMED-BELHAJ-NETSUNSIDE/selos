import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { Suspense } from 'react';

export default function StockByLocationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense fallback={<div>Chargement du layout...</div>}>
      <DashboardLayout>{children}</DashboardLayout>
    </Suspense>
  );
}

