import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface Salesperson {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  code: string | null;
  telephone: string | null;
  adresse: string | null;
  tva: string | null;
  dateEmbauche: string | null;
  statut: string;
  login: string;
  depotName: string;
  depotAdresse: string | null;
  depotTel: string | null;
  depotStatus: number;
  depotRemarque: string | null;
  bcCustomerId: string | null;
  bcCode: string | null; // Code BC (number) pour la traçabilité
  bcLocationId: string | null;
  bcCustomer?: {
    bcId: string;
    number: string | null;
    displayName: string | null;
    email: string | null;
    phoneNumber: string | null;
    addressStreet?: string | null;
    addressCity?: string | null;
    addressPostalCode?: string | null;
    addressCountry?: string | null;
  } | null;
  bcLocation?: {
    id: number;
    bcId: string;
    code?: string | null;
    displayName?: string | null;
  } | null;
  secteur?: {
    id: number;
    nom: string;
  } | null;
  salespersonCanals?: {
    canal: {
      id: number;
      nom: string;
    };
  }[];
  salespersonTypeVentes?: {
    typeVente: {
      id: number;
      nom: string;
    };
  }[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSalespersonData {
  firstName: string;
  lastName: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  dateEmbauche?: string;
  statut?: string;
  login: string;
  password: string;
  depotAdresse?: string;
  depotTel?: string;
  depotStatus?: number;
  depotRemarque?: string;
  bcCustomerId?: string | null;
  bcLocationId?: string | null;
  canalIds?: number[];
  typeVenteIds?: number[];
  secteurId?: number;
}

export interface UpdateSalespersonData extends Partial<Omit<CreateSalespersonData, 'password'>> {
  password?: string;
}

export interface SalespersonsResponse {
  data: Salesperson[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SalespersonsQuery {
  page?: number;
  limit?: number;
  search?: string;
}

export function useSalespersons(query: SalespersonsQuery = {}) {
  return useQuery({
    queryKey: ['salespersons', query],
    queryFn: async (): Promise<SalespersonsResponse> => {
      const params = new URLSearchParams();
      if (query.page) params.append('page', query.page.toString());
      if (query.limit) params.append('limit', query.limit.toString());
      if (query.search) params.append('search', query.search);

      const response = await api.get(`/salespersons?${params.toString()}`);
      return response.data;
    },
  });
}

export function useSalesperson(id: number) {
  return useQuery({
    queryKey: ['salesperson', id],
    queryFn: async (): Promise<Salesperson> => {
      const response = await api.get(`/salespersons/${id}`);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateSalesperson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSalespersonData): Promise<Salesperson> => {
      try {
        const response = await api.post('/salespersons', data);
        return response.data;
      } catch (error: any) {
        // Log l'erreur complète pour le débogage
        console.error('Erreur lors de la création du vendeur:', error);
        console.error('Données envoyées:', data);
        console.error('URL de l\'API:', api.defaults.baseURL);
        
        // Si c'est une erreur réseau, afficher un message plus détaillé
        if (error.code === 'ERR_NETWORK' || error.message?.includes('Network Error')) {
          throw new Error(`Erreur réseau: Impossible de se connecter au serveur. Vérifiez que le backend est démarré et que l'URL est correcte (${api.defaults.baseURL || 'non configurée'})`);
        }
        
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      toast.success('Vendeur créé avec succès');
    },
    onError: (error: any) => {
      let message = error?.response?.data?.message || error?.message || 'Erreur lors de la création du vendeur';
      
      // Améliorer le message d'erreur pour les conflits de client BC
      if (message.includes('client Business Central') && message.includes('déjà associé')) {
        message = 'Ce client Business Central est déjà associé à un autre vendeur. Chaque client BC doit être unique.';
      }
      
      toast.error(message);
    },
  });
}

export function useUpdateSalesperson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: UpdateSalespersonData }): Promise<Salesperson> => {
      const response = await api.patch(`/salespersons/${id}`, data);
      return response.data;
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      queryClient.invalidateQueries({ queryKey: ['salesperson', id] });
      toast.success('Vendeur modifié avec succès');
    },
    onError: (error: any) => {
      let message = error?.response?.data?.message || error?.message || 'Erreur lors de la modification du vendeur';
      
      // Améliorer le message d'erreur pour les conflits de client BC
      if (message.includes('client Business Central') && message.includes('déjà associé')) {
        message = 'Ce client Business Central est déjà associé à un autre vendeur. Chaque client BC doit être unique.';
      }
      
      toast.error(message);
    },
  });
}

export function useDeleteSalesperson() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number): Promise<void> => {
      await api.delete(`/salespersons/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salespersons'] });
      toast.success('Vendeur supprimé avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du vendeur');
    },
  });
}

