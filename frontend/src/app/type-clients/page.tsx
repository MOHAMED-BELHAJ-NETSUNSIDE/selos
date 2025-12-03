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
import { Search, Plus, MoreHorizontal, Edit, Trash2, Loader2, XCircle, Save } from 'lucide-react';
import { useTypeClients, useDeleteTypeClient, type TypeClient } from '@/hooks/use-type-clients';
import api from '@/lib/api';

export default function TypeClientsPage() {
  const { data: typeClients = [], isLoading, error } = useTypeClients();
  const queryClient = useQueryClient();
  const deleteMutation = useDeleteTypeClient();

  // UI state
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<TypeClient | null>(null);
  const [nom, setNom] = useState('');
  const [saving, setSaving] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q
      ? typeClients.filter((t) => t.nom.toLowerCase().includes(q) || String(t.id).includes(q))
      : typeClients;
    const start = (page - 1) * limit;
    return {
      items: items.slice(start, start + limit),
      total: items.length,
      pages: Math.max(1, Math.ceil(items.length / limit)),
    };
  }, [typeClients, search, page]);

  const openCreate = () => {
    setEditing(null);
    setNom('');
    setIsOpen(true);
  };

  const openEdit = (tc: TypeClient) => {
    setEditing(tc);
    setNom(tc.nom);
    setIsOpen(true);
  };

  const handleSave = async () => {
    if (!nom.trim()) {
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api.patch(`/type-clients/${editing.id}`, { nom });
      } else {
        await api.post('/type-clients', { nom });
      }
      setIsOpen(false);
      setEditing(null);
      setNom('');
      await queryClient.invalidateQueries({ queryKey: ['type-clients'] });
    } catch (error) {
      console.error('Error saving type client:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (tc: TypeClient) => {
    if (!confirm(`Supprimer le type client "${tc.nom}" ?`)) return;
    try {
      await deleteMutation.mutateAsync(tc.id);
    } catch (error) {
      console.error('Error deleting type client:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Types de client</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les types de client</p>
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
            <div className="text-center py-8 text-gray-500">
              Aucun type trouvé
              {search && ` pour "${search}"`}
            </div>
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
                  {filtered.items.map((tc) => (
                    <TableRow key={tc.id}>
                      <TableCell className="font-medium">{tc.id}</TableCell>
                      <TableCell>{tc.nom}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEdit(tc)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(tc)}>
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
            <DialogTitle>{editing ? 'Modifier' : 'Ajouter'} un type client</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="nom">Nom *</Label>
            <Input 
              id="nom" 
              value={nom} 
              onChange={(e) => setNom(e.target.value)} 
              placeholder="Ex: Entreprise" 
              onKeyDown={(e) => {
                if (e.key === 'Enter' && nom.trim()) {
                  handleSave();
                }
              }}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={saving || !nom.trim()}>
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

