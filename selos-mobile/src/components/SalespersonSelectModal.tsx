import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { api, isOnline } from '@/lib/api';
import { toast } from 'sonner';
import { Search, User } from 'lucide-react';

interface Salesperson {
  id: number;
  code: string | null;
  firstName: string;
  lastName: string;
  depotName: string;
  statut?: string;
}

interface SalespersonSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (salesperson: Salesperson) => void;
}

export function SalespersonSelectModal({ open, onOpenChange, onSelect }: SalespersonSelectModalProps) {
  const [salespersons, setSalespersons] = useState<Salesperson[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSalespersons();
    }
  }, [open]);

  const loadSalespersons = async () => {
    setLoading(true);
    try {
      if (isOnline()) {
        // Charger depuis l'API
        const response = await api.get('/salespersons', {
          params: { 
            limit: 1000, 
            page: 1,
            statut: 'actif', // Filtrer seulement les vendeurs actifs
          },
        });
        const fetchedSalespersons = (response.data.data || []).filter((sp: any) => sp && sp.id);
        setSalespersons(fetchedSalespersons);
      } else {
        toast.error('Mode hors ligne - Liste des vendeurs non disponible');
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des vendeurs:', error);
      toast.error('Erreur lors du chargement des vendeurs');
    } finally {
      setLoading(false);
    }
  };

  const filteredSalespersons = salespersons.filter((sp) => {
    const searchLower = search.toLowerCase();
    return (
      sp.firstName.toLowerCase().includes(searchLower) ||
      sp.lastName.toLowerCase().includes(searchLower) ||
      sp.depotName.toLowerCase().includes(searchLower) ||
      (sp.code && sp.code.toLowerCase().includes(searchLower))
    );
  });

  const handleSelect = (salesperson: Salesperson) => {
    onSelect(salesperson);
    onOpenChange(false);
    setSearch('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Sélectionner un vendeur</DialogTitle>
          <DialogDescription>
            Choisissez le vendeur pour cette facture de retour
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un vendeur..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                Chargement...
              </div>
            ) : filteredSalespersons.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {search ? 'Aucun vendeur trouvé' : 'Aucun vendeur disponible'}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredSalespersons.map((salesperson) => (
                  <Button
                    key={salesperson.id}
                    variant="outline"
                    className="w-full justify-start h-auto p-4"
                    onClick={() => handleSelect(salesperson)}
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-semibold truncate">
                          {salesperson.firstName} {salesperson.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {salesperson.depotName}
                        </p>
                        {salesperson.code && (
                          <p className="text-xs text-muted-foreground">
                            Code: {salesperson.code}
                          </p>
                        )}
                      </div>
                    </div>
                  </Button>
                ))}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

