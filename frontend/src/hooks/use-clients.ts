import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Client {
  id: number;
  code: string;
  nom: string;
  nomCommercial?: string | null;
  numeroTelephone?: string | null;
  adresse?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  registreCommerce?: string | null;
  canal?: { id: number; nom: string } | null;
  localite?: { id: number; nom: string; delegation?: { id: number; nom: string; gouvernorat?: { id: number; nom: string } } } | null;
  secteur?: { id: number; nom: string } | null;
  typeClient?: { id: number; nom: string } | null;
  typeVente?: { id: number; nom: string } | null;
}

export interface CreateClientData {
  code?: string;
  nom: string;
  nomCommercial?: string;
  numeroTelephone?: string;
  adresse?: string;
  longitude?: number;
  latitude?: number;
  registreCommerce?: string;
  typeClientId?: number;
  typeVenteId?: number;
  canalId?: number;
  localiteId?: number;
  secteurId?: number;
}

export interface UpdateClientData extends Partial<CreateClientData> {}

export interface ClientsResponse {
  data: Client[];
  pagination: { page: number; limit: number; total: number; pages: number };
}

export interface ClientsQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  // Filtres par colonne
  code?: string;
  nom?: string;
  nomCommercial?: string;
  numeroTelephone?: string;
  adresse?: string;
  registreCommerce?: string;
  typeClientId?: number;
  typeVenteId?: number;
  canalId?: number;
  localiteId?: number;
  secteurId?: number;
}

export function useClients(query: ClientsQuery = {}) {
  return useQuery({
    queryKey: ['clients', query],
    queryFn: async (): Promise<ClientsResponse> => {
      try {
        const params = new URLSearchParams();
        if (query.page) params.append('page', query.page.toString());
        if (query.limit) params.append('limit', query.limit.toString());
        if (query.search) params.append('search', query.search);
        if (query.sortBy) params.append('sortBy', query.sortBy);
        if (query.sortOrder) params.append('sortOrder', query.sortOrder);
        
        // Ajouter les filtres par colonne
        if (query.code) params.append('code', query.code);
        if (query.nom) params.append('nom', query.nom);
        if (query.nomCommercial) params.append('nomCommercial', query.nomCommercial);
        if (query.numeroTelephone) params.append('numeroTelephone', query.numeroTelephone);
        if (query.adresse) params.append('adresse', query.adresse);
        if (query.registreCommerce) params.append('registreCommerce', query.registreCommerce);
        if (query.typeClientId) params.append('typeClientId', query.typeClientId.toString());
        if (query.typeVenteId) params.append('typeVenteId', query.typeVenteId.toString());
        if (query.canalId) params.append('canalId', query.canalId.toString());
        if (query.localiteId) params.append('localiteId', query.localiteId.toString());
        if (query.secteurId) params.append('secteurId', query.secteurId.toString());
        
        const res = await api.get(`/clients?${params.toString()}`);
        // Assurer que la réponse a la structure attendue
        if (res.data && Array.isArray(res.data.data)) {
          return res.data;
        }
        // Si la réponse est directement un tableau, la transformer
        if (Array.isArray(res.data)) {
          return {
            data: res.data,
            pagination: { page: 1, limit: res.data.length, total: res.data.length, pages: 1 },
          };
        }
        return res.data;
      } catch (error: any) {
        console.error('Error fetching clients:', error);
        // Provide more helpful error message for network errors
        if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
          const apiUrl = api.defaults.baseURL || 'non configurée';
          throw new Error(
            `Erreur réseau: Impossible de se connecter au serveur. Vérifiez que le backend est démarré et que l'URL est correcte (${apiUrl})`
          );
        }
        throw error;
      }
    },
  });
}

export function useClient(id: number | null) {
  return useQuery({
    queryKey: ['client', id],
    queryFn: async (): Promise<Client> => (await api.get(`/clients/${id}`)).data,
    enabled: !!id,
  });
}

export interface ClientStatistics {
  chiffreAffaires: number;
  nombreBonsLivraison: number;
  meilleurProduit: {
    product: {
      id: number;
      designation: string;
      bcItem: {
        id: number;
        number: string | null;
        displayName: string | null;
      } | null;
    };
    totalAmount: number;
    totalQuantity: number;
  } | null;
  nombreProduits: number;
}

export function useClientStatistics(clientId: number | null) {
  return useQuery<ClientStatistics>({
    queryKey: ['client', clientId, 'statistics'],
    queryFn: async (): Promise<ClientStatistics> => 
      (await api.get(`/clients/${clientId}/statistics`)).data,
    enabled: !!clientId,
  });
}

export function useCreateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: CreateClientData): Promise<Client> => (await api.post('/clients', data)).data,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client créé'); },
    onError: () => toast.error('Erreur lors de la création du client'),
  });
}

export function useUpdateClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateClientData }): Promise<Client> => (await api.patch(`/clients/${id}`, data)).data,
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['clients'] });
      qc.invalidateQueries({ queryKey: ['client', variables.id] });
      toast.success('Client modifié');
    },
    onError: () => toast.error('Erreur lors de la modification'),
  });
}

export function useDeleteClient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number): Promise<void> => { await api.delete(`/clients/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['clients'] }); toast.success('Client supprimé'); },
    onError: () => toast.error('Erreur lors de la suppression'),
  });
}


