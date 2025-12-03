'use client';

import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, UserCheck, Shield, FileText } from 'lucide-react';

export default function DashboardPage() {
  const { data: session } = useSession();

  const stats = [
    {
      title: 'Clients',
      value: '0',
      description: 'Total des clients',
      icon: Users,
      color: 'text-blue-600',
    },
    {
      title: 'Utilisateurs',
      value: '0',
      description: 'Utilisateurs actifs',
      icon: UserCheck,
      color: 'text-green-600',
    },
    {
      title: 'Rôles',
      value: '3',
      description: 'Rôles configurés',
      icon: Shield,
      color: 'text-purple-600',
    },
    {
      title: 'Logs',
      value: '0',
      description: 'Actions enregistrées',
      icon: FileText,
      color: 'text-orange-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">
          Bienvenue, {session?.user?.firstName} !
        </h1>
        <p className="text-gray-600 dark:text-gray-900">
          Voici un aperçu de votre tableau de bord Selos.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {stat.title}
                </CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}



