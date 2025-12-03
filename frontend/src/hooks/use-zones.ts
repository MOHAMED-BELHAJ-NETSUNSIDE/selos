import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface Zone {
  id: number;
  nom: string;
  frequenceVisite?: string | null;
  clientCount?: number;
  zoneCanals?: {
    canal: {
      id: number;
      nom: string;
    };
  }[];
  zoneTypeVentes?: {
    typeVente: {
      id: number;
      nom: string;
    };
  }[];
  zoneLocalites?: {
    localite: {
      id: number;
      nom: string;
      delegation?: {
        id: number;
        nom: string;
        gouvernorat?: {
          id: number;
          nom: string;
        };
      };
    };
  }[];
}

export function useZones() {
  return useQuery<Zone[]>({
    queryKey: ['zones'],
    queryFn: async () => (await api.get('/zones')).data,
  });
}

export function useCreateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { nom: string; canalIds: number[]; typeVenteIds: number[]; localiteIds?: number[]; frequenceVisite?: string }) => (await api.post('/zones', data)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone créée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la création de la zone');
    },
  });
}

export function useUpdateZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number; data: { nom?: string; canalIds?: number[]; typeVenteIds?: number[]; localiteIds?: number[]; frequenceVisite: string } }) => {
      // Construire les données de mise à jour
      const updateData: any = {};
      
      if (data.nom !== undefined && data.nom !== null && data.nom !== '') {
        updateData.nom = data.nom;
      }
      if (data.canalIds !== undefined && data.canalIds !== null && Array.isArray(data.canalIds) && data.canalIds.length > 0) {
        updateData.canalIds = data.canalIds;
      }
      // Ne pas envoyer typeVenteIds s'il est undefined, null ou vide
      if (data.typeVenteIds !== undefined && data.typeVenteIds !== null && Array.isArray(data.typeVenteIds) && data.typeVenteIds.length > 0) {
        updateData.typeVenteIds = data.typeVenteIds;
      }
      // localiteIds peut être un tableau vide (pour supprimer toutes les localités)
      if (data.localiteIds !== undefined && data.localiteIds !== null && Array.isArray(data.localiteIds)) {
        updateData.localiteIds = data.localiteIds;
      }
      // frequenceVisite est maintenant obligatoire, toujours l'envoyer
      // Vérifier qu'il est défini et valide
      if (data.frequenceVisite && data.frequenceVisite !== '' && data.frequenceVisite !== 'none') {
        updateData.frequenceVisite = data.frequenceVisite;
      } else {
        throw new Error('La fréquence de visite est requise');
      }
      
      return (await api.patch(`/zones/${id}`, updateData)).data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone modifiée avec succès');
    },
    onError: (error: any) => {
      const errorMessage = error?.response?.data?.message || error?.message || 'Erreur lors de la modification de la zone';
      toast.error(errorMessage);
    },
  });
}

export function useDeleteZone() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => (await api.delete(`/zones/${id}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['zones'] });
      toast.success('Zone supprimée avec succès');
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la zone');
    },
  });
}


