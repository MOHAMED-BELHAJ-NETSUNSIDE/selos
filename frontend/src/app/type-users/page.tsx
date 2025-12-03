'use client';

import { useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, Save, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { useTypeUsers, type TypeUser } from '@/hooks/use-type-users';

export default function TypeUsersPage() {
  const { data: typeUsers = [], refetch, isLoading, error } = useTypeUsers();
  const queryClient = useQueryClient();

  // UI state similar to /users
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TypeUser | null>(null);
  const [nom, setNom] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q
      ? typeUsers.filter((t) => t.nom.toLowerCase().includes(q) || String(t.id).includes(q))
      : typeUsers;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    };
  }, [typeUsers, search, page]);

  const openCreate = () => {
    setEditing(null);
    setNom('');
    setIsOpen(true);
  };

  const openEdit = (tu: TypeUser) => {
    setEditing(tu);
    setNom(tu.nom);
    setIsOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/type-users/${editing.id}`, { nom });
      } else {
        await api.post('/type-users', { nom });
      }
      setIsOpen(false);
      setEditing(null);
      setNom('');
      await queryClient.invalidateQueries({ queryKey: ['type-users'] });
      await refetch();
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tu: TypeUser) => {
    if (!confirm('Supprimer ce type utilisateur ?')) return;
    await api.delete(`/type-users/${tu.id}`);
    await queryClient.invalidateQueries({ queryKey: ['type-users'] });
    await refetch();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Types d'utilisateur</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les types d'utilisateur</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Ajouter
        </Button>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher un type..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-10"
              />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="ml-2">Chargement...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-600">Erreur lors du chargement</div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8 text-gray-500">Aucun type trouvé</div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((tu) => (
                    <TableRow key={tu.id}>
                      <TableCell className="font-medium">{tu.id}</TableCell>
                      <TableCell>{tu.nom}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(tu)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(tu)}>
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

              {filtered.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">Page {page} sur {filtered.pages}</div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                    >
                      Précédent
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.min(filtered.pages, p + 1))}
                      disabled={page === filtered.pages}
                    >
                      Suivant
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editing ? 'Modifier' : 'Ajouter'} un type utilisateur</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom</Label>
            <Input id="nom" value={nom} onChange={(e) => setNom(e.target.value)} placeholder="Ex: Responsable" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
