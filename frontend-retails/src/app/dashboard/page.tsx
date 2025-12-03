'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Bienvenue sur Selos Retails</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Bienvenue, {session?.user?.firstName} {session?.user?.lastName}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Vous êtes connecté en tant que {session?.user?.typeUser?.nom || 'Salesperson'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

