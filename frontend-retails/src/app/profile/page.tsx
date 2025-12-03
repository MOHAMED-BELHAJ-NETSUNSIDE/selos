'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function ProfilePage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Profil</h1>
        <p className="text-muted-foreground">Informations de votre compte</p>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Informations personnelles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
            <p className="text-base">
              {session?.user?.firstName} {session?.user?.lastName}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Email</p>
            <p className="text-base">{session?.user?.email}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Type utilisateur</p>
            <p className="text-base">{session?.user?.typeUser?.nom || 'Salesperson'}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">Rôle</p>
            <p className="text-base">{session?.user?.role?.name || '—'}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

