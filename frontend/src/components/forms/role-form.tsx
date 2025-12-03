'use client';

import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useCreateRole, useUpdateRole, type Role } from '@/hooks/use-roles';
import { Loader2, Save, XCircle } from 'lucide-react';
import { usePermissionsCatalog } from '@/hooks/use-permissions-catalog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const roleSchema = z.object({
  name: z.string().min(1, 'Le nom du rôle est requis'),
  permissions: z.array(z.string()).min(1, 'Au moins une permission est requise'),
});

interface RoleFormProps {
  role?: Role | null;
  isOpen: boolean;
  onClose: () => void;
  mode: 'create' | 'edit';
}

export function RoleForm({ role, isOpen, onClose, mode }: RoleFormProps) {
  const createRoleMutation = useCreateRole();
  const updateRoleMutation = useUpdateRole();
  const { data: catalog = [], isLoading: catLoading } = usePermissionsCatalog();

  const form = useForm<z.infer<typeof roleSchema>>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      name: role?.name || '',
      permissions: role?.permissions || [],
    },
  });

  useEffect(() => {
    if (mode === 'edit' && role) {
      form.reset({ name: role.name, permissions: role.permissions });
    } else if (mode === 'create') {
      form.reset({ name: '', permissions: [] });
    }
  }, [role, mode, form]);

  const selected = form.watch('permissions');

  type Row = { key: string; label: string; read?: string; write?: string; delete?: string };
  const rows: Row[] = useMemo(() => {
    return catalog.map((m) => {
      const row: Row = { key: m.key, label: m.label } as Row;
      m.permissions.forEach((perm) => {
        const cap = perm.split(':')[1];
        if (cap === 'read') row.read = perm;
        if (cap === 'write') row.write = perm;
        if (cap === 'delete') row.delete = perm;
      });
      return row;
    });
  }, [catalog]);

  // Helper for row-level "Tout"
  const rowAllChecked = (r: Row) => {
    const rowPerms = [r.read, r.write, r.delete].filter(Boolean) as string[];
    return rowPerms.length > 0 && rowPerms.every((p) => selected.includes(p));
  };
  const toggleRowAll = (r: Row, checked: boolean | string) => {
    const current = new Set(form.getValues('permissions'));
    const rowPerms = [r.read, r.write, r.delete].filter(Boolean) as string[];
    if (checked) {
      rowPerms.forEach((p) => current.add(p));
    } else {
      rowPerms.forEach((p) => current.delete(p));
    }
    form.setValue('permissions', Array.from(current), { shouldValidate: true });
  };

  const togglePermission = (permission: string | undefined, checked: boolean | string) => {
    if (!permission) return;
    const current = new Set(form.getValues('permissions'));
    if (checked) current.add(permission); else current.delete(permission);
    form.setValue('permissions', Array.from(current), { shouldValidate: true });
  };

  const isChecked = (permission?: string) => (permission ? selected.includes(permission) : false);

  const onSubmit = async (values: z.infer<typeof roleSchema>) => {
    try {
      if (mode === 'create') {
        await createRoleMutation.mutateAsync(values);
      } else if (mode === 'edit' && role) {
        await updateRoleMutation.mutateAsync({ id: role.id, data: values });
      }
      onClose();
    } catch (error) {
      console.error('Form submission error:', error);
    }
  };

  const isSubmitting = createRoleMutation.isPending || updateRoleMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl flex flex-col">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Créer un rôle' : 'Modifier le rôle'}</DialogTitle>
          <DialogDescription>Définissez les permissions par module</DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col flex-1 min-h-0 space-y-4">
          <div className="space-y-2 flex-shrink-0">
            <Label htmlFor="name">Nom du rôle</Label>
            <Input id="name" {...form.register('name')} placeholder="Ex: Admin" />
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto">
            {catLoading ? (
              <div className="flex items-center text-gray-600"><Loader2 className="h-4 w-4 animate-spin mr-2"/>Chargement des permissions...</div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-background z-10">
                    <TableRow>
                      <TableHead>Module</TableHead>
                      <TableHead>Tout</TableHead>
                      <TableHead>Lecture</TableHead>
                      <TableHead>Écriture</TableHead>
                      <TableHead>Suppression</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rows.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell className="font-medium">{r.label}</TableCell>
                        <TableCell>
                          <Checkbox checked={rowAllChecked(r)} onCheckedChange={(c) => toggleRowAll(r, c)} />
                        </TableCell>
                        <TableCell>
                          {r.read ? (
                            <Checkbox checked={isChecked(r.read)} onCheckedChange={(c) => togglePermission(r.read, c)} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.write ? (
                            <Checkbox checked={isChecked(r.write)} onCheckedChange={(c) => togglePermission(r.write, c)} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          {r.delete ? (
                            <Checkbox checked={isChecked(r.delete)} onCheckedChange={(c) => togglePermission(r.delete, c)} />
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 flex-shrink-0 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : mode === 'create' ? (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Créer
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Modifier
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

