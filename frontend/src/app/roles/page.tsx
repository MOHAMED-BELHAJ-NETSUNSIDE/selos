'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, Shield, Loader2 } from 'lucide-react';
import { useRoles, useDeleteRole, type Role } from '@/hooks/use-roles';
import { RoleForm } from '@/components/forms/role-form';
import { RoleDetailsModal } from '@/components/modals/role-details-modal';


export default function RolesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [search, setSearch] = useState('');
  
  // États pour les modales
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const { data: roles, isLoading, error } = useRoles();
  const deleteMutation = useDeleteRole();

  // Rediriger vers la page de connexion si pas connecté
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  // Afficher un loader pendant la vérification de session
  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Vérification de la session...</span>
      </div>
    );
  }

  // Ne pas afficher le contenu si pas connecté
  if (status === 'unauthenticated') {
    return null;
  }

  // Filtrer les rôles selon la recherche
  const filteredRoles = roles?.filter(role =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.permissions.some(permission =>
      permission.toLowerCase().includes(search.toLowerCase())
    )
  ) || [];

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce rôle ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting role:', error);
      }
    }
  };

  const handleCreate = () => {
    setSelectedRole(null);
    setIsCreateModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setSelectedRole(role);
    setIsEditModalOpen(true);
  };

  const handleView = (role: Role) => {
    setSelectedRoleId(role.id);
    setIsDetailsModalOpen(true);
  };

  const handleCloseModals = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDetailsModalOpen(false);
    setSelectedRole(null);
    setSelectedRoleId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Rôles</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les rôles et permissions</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un rôle
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un rôle..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement des rôles...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              <div className="mb-2">Erreur lors du chargement des rôles</div>
              <div className="text-sm text-gray-500">
                {error.message || 'Vérifiez votre connexion et vos permissions'}
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                variant="outline" 
                className="mt-4"
              >
                Réessayer
              </Button>
            </div>
          ) : filteredRoles.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {search ? 'Aucun rôle trouvé pour cette recherche' : 'Aucun rôle trouvé'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Permissions</TableHead>
                  <TableHead>Date de création</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRoles.map((role) => (
                  <TableRow key={role.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <Shield className="mr-2 h-4 w-4" />
                        {role.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 3).map((permission) => (
                          <span
                            key={permission}
                            className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800"
                          >
                            {permission}
                          </span>
                        ))}
                        {role.permissions.length > 3 && (
                          <span className="text-xs text-gray-500">
                            +{role.permissions.length - 3} autres
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(role.createdAt).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(role)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Consulter
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(role)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => handleDelete(role.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Modales */}
      <RoleForm
        role={selectedRole}
        isOpen={isCreateModalOpen}
        onClose={handleCloseModals}
        mode="create"
      />
      
      <RoleForm
        role={selectedRole}
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        mode="edit"
      />
      
      <RoleDetailsModal
        roleId={selectedRoleId}
        isOpen={isDetailsModalOpen}
        onClose={handleCloseModals}
      />
    </div>
  );
}