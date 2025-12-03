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
import { db } from '@/lib/db';
import { toast } from 'sonner';

interface Client {
  id: number;
  code: string;
  nom: string;
  nomCommercial?: string;
  numeroTelephone?: string;
  adresse?: string;
}

interface ClientSelectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (client: Client) => void;
}

export function ClientSelectModal({ open, onOpenChange, onSelect }: ClientSelectModalProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadClients();
    }
  }, [open]);

  const loadClients = async () => {
    setLoading(true);
    try {
      if (isOnline()) {
        // Charger depuis l'API
        const response = await api.get('/clients', {
          params: { limit: 100, page: 1 },
        });
        const fetchedClients = (response.data.data || []).filter((client: any) => client && client.id);
        setClients(fetchedClients);

        // Mettre en cache (éviter les doublons)
        for (const client of fetchedClients) {
          if (client && client.id) {
            // Vérifier si le client existe déjà dans le cache
            const existing = await db.cachedClients
              .where('clientId')
              .equals(client.id)
              .first();
            
            if (existing) {
              // Mettre à jour l'enregistrement existant
              await db.cachedClients.update(existing.id!, {
                code: client.code || '',
                nom: client.nom || '',
                nomCommercial: client.nomCommercial || undefined,
                numeroTelephone: client.numeroTelephone || undefined,
                adresse: client.adresse || undefined,
                lastUpdated: new Date(),
              });
            } else {
              // Créer un nouvel enregistrement
              await db.cachedClients.add({
                clientId: client.id,
                code: client.code || '',
                nom: client.nom || '',
                nomCommercial: client.nomCommercial || undefined,
                numeroTelephone: client.numeroTelephone || undefined,
                adresse: client.adresse || undefined,
                lastUpdated: new Date(),
              });
            }
          }
        }
      } else {
        // Charger depuis le cache (dédupliquer par clientId)
        const cachedClients = await db.cachedClients.toArray();
        // Créer un Map pour éliminer les doublons par clientId
        const uniqueClientsMap = new Map<number, any>();
        for (const c of cachedClients) {
          if (c && c.clientId && !uniqueClientsMap.has(c.clientId)) {
            uniqueClientsMap.set(c.clientId, c);
          }
        }
        setClients(
          Array.from(uniqueClientsMap.values()).map((c) => ({
            id: c.clientId,
            code: (c as any).code || '',
            nom: (c as any).nom || '',
            nomCommercial: (c as any).nomCommercial || undefined,
            numeroTelephone: (c as any).numeroTelephone || undefined,
            adresse: (c as any).adresse || undefined,
          }))
        );
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des clients:', error);
      
      // Gestion d'erreur détaillée
      if (error.response?.status === 403) {
        toast.error('Permission refusée. Contactez l\'administrateur.');
      } else if (error.response?.status === 401) {
        toast.error('Session expirée. Veuillez vous reconnecter.');
      } else if (error.code === 'ERR_NETWORK') {
        toast.error('Erreur réseau. Vérifiez votre connexion.');
      }
      
      // Essayer de charger depuis le cache en cas d'erreur (dédupliquer)
      const cachedClients = await db.cachedClients.toArray();
      if (cachedClients.length > 0) {
        // Créer un Map pour éliminer les doublons par clientId
        const uniqueClientsMap = new Map<number, any>();
        for (const c of cachedClients) {
          if (c && c.clientId && !uniqueClientsMap.has(c.clientId)) {
            uniqueClientsMap.set(c.clientId, c);
          }
        }
        setClients(
          Array.from(uniqueClientsMap.values()).map((c) => ({
            id: c.clientId,
            code: (c as any).code || '',
            nom: (c as any).nom || '',
            nomCommercial: (c as any).nomCommercial || undefined,
            numeroTelephone: (c as any).numeroTelephone || undefined,
            adresse: (c as any).adresse || undefined,
          }))
        );
        if (!isOnline()) {
          toast.info('Mode hors ligne - Données en cache');
        } else {
          toast.warning('Données en cache (erreur API)');
        }
      } else {
        toast.error('Aucune donnée disponible');
      }
    } finally {
      setLoading(false);
    }
  };

  const filteredClients = clients.filter(
    (client) => {
      if (!client) return false;
      const searchLower = search.toLowerCase();
      return (
        (client.nom?.toLowerCase() || '').includes(searchLower) ||
        (client.code?.toLowerCase() || '').includes(searchLower) ||
        (client.nomCommercial?.toLowerCase() || '').includes(searchLower) ||
        (client.numeroTelephone || '').includes(search)
      );
    }
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sélectionner un client</DialogTitle>
          <DialogDescription>
            Recherchez et sélectionnez un client
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Input
            placeholder="Rechercher un client..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun client trouvé
            </div>
          ) : (
            <div className="space-y-2">
              {filteredClients.map((client) => (
                <Button
                  key={client.id}
                  variant="outline"
                  className="w-full justify-start text-left h-auto py-3"
                  onClick={() => {
                    onSelect(client);
                    onOpenChange(false);
                  }}
                >
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {client.nom || 'Sans nom'}
                    </span>
                    {client.code && (
                      <span className="text-xs text-muted-foreground">
                        Code: {client.code}
                      </span>
                    )}
                    {client.nomCommercial && (
                      <span className="text-xs text-muted-foreground">
                        {client.nomCommercial}
                      </span>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

