'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useRole } from '@/hooks/use-roles';
import { Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { groupPermissionsByModule } from '@/lib/permissions-utils';

interface RoleDetailsModalProps {
  roleId: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export function RoleDetailsModal({ roleId, isOpen, onClose }: RoleDetailsModalProps) {
  const { data: role, isLoading, error } = useRole(roleId);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Détails du rôle</DialogTitle>
          <DialogDescription>
            Informations complètes sur le rôle.
          </DialogDescription>
        </DialogHeader>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
            <span className="ml-2">Chargement des détails...</span>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-red-600">
            Erreur lors du chargement des détails du rôle.
          </div>
        ) : role ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium">Nom:</p>
              <p className="col-span-2">
                <Badge variant="secondary">{role.name}</Badge>
              </p>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium">Créé le:</p>
              <p className="col-span-2">{new Date(role.createdAt).toLocaleString('fr-FR')}</p>
            </div>
            <div className="grid grid-cols-3 items-center gap-4">
              <p className="text-sm font-medium">Dernière mise à jour:</p>
              <p className="col-span-2">{new Date(role.updatedAt).toLocaleString('fr-FR')}</p>
            </div>
            <div className="space-y-3">
              <p className="text-sm font-medium">Permissions:</p>
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
                        {Object.entries(groupPermissionsByModule(role.permissions))
                          .filter(([_, modulePerms]) => modulePerms.read || modulePerms.write || modulePerms.delete)
                          .map(([moduleKey, modulePerms]) => (
                          <tr key={moduleKey} className="border-b">
                            <td className="py-2 font-medium">{modulePerms.module}</td>
                            <td className="text-center py-2">
                              {modulePerms.read ? (
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
                              {modulePerms.write ? (
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
                              {modulePerms.delete ? (
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
                        ))}
                      </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

