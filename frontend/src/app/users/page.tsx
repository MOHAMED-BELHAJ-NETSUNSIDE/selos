'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Plus, Search, MoreHorizontal, Eye, Edit, Trash2, UserCheck, UserX, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { useUsers, useToggleUserActive, useDeleteUser, type User } from '@/hooks/use-users';
import { UserForm } from '@/components/forms/user-form';
import { UserDetailsModal } from '@/components/modals/user-details-modal';

export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;
  
  // États pour les drawers
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const { data: usersData, isLoading, error } = useUsers({
    page,
    limit,
    search: search || undefined,
  });

  const toggleActiveMutation = useToggleUserActive();
  const deleteMutation = useDeleteUser();

  const users = usersData?.data || [];
  const totalPages = usersData?.pagination?.pages || 0;

  const handleToggleActive = async (id: string) => {
    try {
      await toggleActiveMutation.mutateAsync(id);
    } catch (error) {
      console.error('Error toggling user status:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  const handleCreate = () => {
    setSelectedUser(null);
    setIsCreateOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
  };

  const handleView = (user: User) => {
    setSelectedUserId(user.id);
    setIsDetailsOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Utilisateurs</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les utilisateurs du système</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un utilisateur
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un utilisateur..."
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
              <span className="ml-2">Chargement des utilisateurs...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Erreur lors du chargement des utilisateurs
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun utilisateur trouvé
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Type utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date de création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">
                        {user.firstName} {user.lastName}
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-violet-100 text-violet-800">
                          {user.typeUser?.nom || '—'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {user.role.name}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleView(user)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Consulter
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEdit(user)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(user.id)}
                              disabled={toggleActiveMutation.isPending}
                            >
                              {user.isActive ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Désactiver
                                </>
                              ) : (
                                <>
                                  <UserCheck className="mr-2 h-4 w-4" />
                                  Activer
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => handleDelete(user.id)}
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
              
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">
                    Page {page} sur {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page - 1)}
                      disabled={page === 1}
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage(page + 1)}
                      disabled={page === totalPages}
                    >
                      Suivant
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Drawers */}
      <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DrawerContent side="right" className="h-full w-full sm:max-w-2xl flex flex-col">
          <DrawerHeader>
            <DrawerTitle>Créer un utilisateur</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <UserForm onSuccess={() => setIsCreateOpen(false)} mode="create" />
          </div>
        </DrawerContent>
      </Drawer>

      <Drawer open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Modifier l'utilisateur</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6">
            <UserForm user={selectedUser} onSuccess={() => setIsEditOpen(false)} mode="edit" />
          </div>
        </DrawerContent>
      </Drawer>

      <UserDetailsModal
        userId={selectedUserId}
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </div>
  );
}
