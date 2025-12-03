import { Header } from '@/components/Header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { LogOut, User as UserIcon } from 'lucide-react';

export function Profile() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="pb-20">
      <Header title="Profil" showSync={false} />
      <div className="container mx-auto px-4 py-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserIcon className="h-5 w-5" />
              Informations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-muted-foreground">Nom complet</p>
              <p className="font-medium">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="font-medium">{user?.email}</p>
            </div>
            {user?.salesperson && (
              <>
                <div>
                  <p className="text-sm text-muted-foreground">Code vendeur</p>
                  <p className="font-medium">{user.salesperson.code || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Dépôt</p>
                  <p className="font-medium">{user.salesperson.depotName}</p>
                </div>
              </>
            )}
            {user?.role && (
              <div>
                <p className="text-sm text-muted-foreground">Rôle</p>
                <p className="font-medium">{user.role.name}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Button
          variant="destructive"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Se déconnecter
        </Button>
      </div>
    </div>
  );
}

