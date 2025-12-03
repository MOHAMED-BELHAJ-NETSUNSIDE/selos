'use client';

import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useUser } from '@/hooks/use-users';
import { Loader2, XCircle, Store } from 'lucide-react';
import { usePermissionsCatalog } from '@/hooks/use-permissions-catalog';

interface UserDetailsModalProps {
  userId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

// Utility function to parse permissions from various formats
function parsePermissions(permissions: any): string[] {
  if (Array.isArray(permissions)) {
    return permissions;
  } else if (typeof permissions === 'string') {
    try {
      return JSON.parse(permissions);
    } catch {
      return permissions.split(',').map((p: string) => p.trim());
    }
  } else {
    return [];
  }
}

export function UserDetailsModal({ userId, isOpen, onClose }: UserDetailsModalProps) {
  const { data: user, isLoading, error } = useUser(userId || '');
  const { data: catalog = [], isLoading: catalogLoading } = usePermissionsCatalog();

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        side="right" 
        className="h-full flex flex-col"
        style={{ width: '60vw', maxWidth: '60vw' }}
      >
        <DrawerHeader>
          <DrawerTitle>Détails de l'utilisateur</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">
              Erreur lors du chargement des détails
            </div>
          ) : user ? (
            <Tabs defaultValue="profil" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profil">Profil & Informations</TabsTrigger>
                <TabsTrigger value="permissions">Rôle & Permissions</TabsTrigger>
                <TabsTrigger value="logistique" className="flex items-center space-x-2">
                  <Store className="h-4 w-4" />
                  <span>Logistique</span>
                </TabsTrigger>
              </TabsList>

              {/* Onglet 1 : Profil & Informations */}
              <TabsContent value="profil" className="mt-4 space-y-6">
                {/* Informations personnelles */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations personnelles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                      <p className="text-base">{user.firstName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Nom</p>
                      <p className="text-base">{user.lastName}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Email</p>
                      <p className="text-base">{user.email}</p>
                    </div>
                  </div>
                </div>

                {/* Informations professionnelles */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Informations professionnelles</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {user.typeUser && (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Type utilisateur</p>
                        <div className="mt-1">
                          <Badge variant="secondary" className="text-sm">
                            {user.typeUser.nom}
                          </Badge>
                        </div>
                      </div>
                    )}
                        {user.secteur && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Secteur</p>
                            <p className="text-base">{user.secteur.nom}</p>
                          </div>
                        )}
                        {user.region && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Région</p>
                            <p className="text-base">{user.region.nom}</p>
                          </div>
                        )}
                        {user.canal && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Canal</p>
                            <p className="text-base">{user.canal.nom}</p>
                          </div>
                        )}
                        {user.typeVente && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Type de vente</p>
                            <p className="text-base">{user.typeVente.nom}</p>
                          </div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Statut</p>
                          <div className="mt-1">
                            <Badge 
                              variant={user.isActive ? "default" : "destructive"}
                              className="text-sm"
                            >
                              {user.isActive ? 'Actif' : 'Inactif'}
                            </Badge>
                          </div>
                        </div>
                  </div>
                </div>

                {/* Informations système */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Informations système</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Date de création</p>
                      <p className="text-sm">{new Date(user.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Dernière modification</p>
                      <p className="text-sm">{new Date(user.updatedAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet 2 : Rôle & Permissions */}
              <TabsContent value="permissions" className="mt-4 space-y-6">
                {/* Rôle */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Rôle</h3>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Nom du rôle</p>
                    <div className="mt-1">
                      <Badge variant="secondary" className="text-sm">
                        {user.role.name}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Permissions */}
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Permissions</h3>
                  {catalogLoading ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      <span className="text-sm text-muted-foreground">Chargement des modules...</span>
                    </div>
                  ) : (
                    <div className="border rounded-lg p-4">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 font-medium">Module</th>
                              <th className="text-center py-2 font-medium">Lecture</th>
                              <th className="text-center py-2 font-medium">Écriture</th>
                              <th className="text-center py-2 font-medium">Suppression</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const parsedPerms = parsePermissions(user.role.permissions);
                              const modulesWithPermissions = catalog.map((module) => {
                                const read = module.permissions.find(p => p.endsWith(':read'));
                                const write = module.permissions.find(p => p.endsWith(':write'));
                                const deletePerm = module.permissions.find(p => p.endsWith(':delete'));
                                
                                const hasRead = read ? parsedPerms.includes(read) : false;
                                const hasWrite = write ? parsedPerms.includes(write) : false;
                                const hasDelete = deletePerm ? parsedPerms.includes(deletePerm) : false;
                                
                                // Afficher seulement les modules qui ont au moins une permission
                                if (!hasRead && !hasWrite && !hasDelete) return null;
                                
                                return {
                                  module,
                                  hasRead,
                                  hasWrite,
                                  hasDelete,
                                };
                              }).filter(Boolean);
                              
                              if (modulesWithPermissions.length === 0) {
                                return (
                                  <tr>
                                    <td colSpan={4} className="text-center py-4 text-muted-foreground text-sm">
                                      Aucun module avec permissions
                                    </td>
                                  </tr>
                                );
                              }
                              
                              return modulesWithPermissions.map(({ module, hasRead, hasWrite, hasDelete }) => (
                                <tr key={module.key} className="border-b">
                                  <td className="py-2 font-medium">{module.label}</td>
                                  <td className="text-center py-2">
                                    {hasRead ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        ✓
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                                        ✗
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center py-2">
                                    {hasWrite ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        ✓
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                                        ✗
                                      </Badge>
                                    )}
                                  </td>
                                  <td className="text-center py-2">
                                    {hasDelete ? (
                                      <Badge variant="default" className="bg-green-100 text-green-800">
                                        ✓
                                      </Badge>
                                    ) : (
                                      <Badge variant="secondary" className="bg-gray-100 text-gray-500">
                                        ✗
                                      </Badge>
                                    )}
                                  </td>
                                </tr>
                              ));
                            })()}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>

              {/* Onglet 3 : Logistique */}
              <TabsContent value="logistique" className="mt-4 space-y-6">
                {/* Informations logistiques */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Informations logistiques</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {user.bcLocation ? (
                      <>
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Magasin</p>
                          <div className="mt-1">
                            <Badge variant="secondary" className="text-sm">
                              <Store className="h-3 w-3 mr-1" />
                              {user.bcLocation.displayName || user.bcLocation.code || `Magasin ${user.bcLocation.id}`}
                            </Badge>
                          </div>
                        </div>
                        {user.bcLocation.code && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Code magasin</p>
                            <p className="text-base">{user.bcLocation.code}</p>
                          </div>
                        )}
                        {user.bcLocation.bcId && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">ID Business Central</p>
                            <p className="text-base font-mono text-sm">{user.bcLocation.bcId}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="col-span-2">
                        <p className="text-sm text-muted-foreground">Aucun magasin assigné</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          ) : (
            <div className="text-center py-8 text-gray-500">Aucune information disponible</div>
          )}
        </div>
        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}



