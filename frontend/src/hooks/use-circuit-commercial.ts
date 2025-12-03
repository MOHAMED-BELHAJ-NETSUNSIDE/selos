import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';

export interface CircuitCommercialZone {
  id: number;
  zoneId: number;
  jour: number;
  frequence: 'semaine' | 'quinzaine' | 'mois';
  groupes?: string | null;
  zone: {
    id: number;
    nom: string;
    zoneCanals?: {
      canal: {
        id: number;
        nom: string;
      };
    }[];
  };
}

export interface CircuitCommercial {
  id: number;
  secteurId: number;
  secteur: {
    id: number;
    nom: string;
    canalId: number;
    canal?: {
      id: number;
      nom: string;
    };
  };
  circuitCommercialZones: CircuitCommercialZone[];
  createdAt: string;
  updatedAt: string;
}

export interface UpdateCircuitCommercialData {
  zones: {
    zoneId: number;
    jour: number;
    frequence: 'semaine' | 'quinzaine' | 'mois';
    groupes?: string;
  }[];
}

export function useCircuitCommercial(secteurId: number | null) {
  return useQuery<CircuitCommercial>({
    queryKey: ['circuit-commercial', secteurId],
    queryFn: async () => {
      const res = await api.get(`/secteurs/${secteurId}/circuit-commercial`);
      return res.data;
    },
    enabled: !!secteurId,
  });
}

export function useUpdateCircuitCommercial() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ secteurId, data }: { secteurId: number; data: UpdateCircuitCommercialData }) => {
      const res = await api.put(`/secteurs/${secteurId}/circuit-commercial`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['circuit-commercial', variables.secteurId] });
      toast.success('Circuit commercial mis à jour avec succès');
    },
    onError: (error: any) => {
      const message = error?.response?.data?.message || 'Erreur lors de la mise à jour du circuit commercial';
      toast.error(message);
    },
  });
}


