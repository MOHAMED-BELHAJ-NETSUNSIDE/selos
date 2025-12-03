import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import { Zone } from '@/hooks/use-zones';
import { TypeVente } from '@/hooks/use-type-ventes';

export function useSecteurZones(secteurId: number | null) {
  return useQuery<Zone[]>({
    queryKey: ['secteur-zones', secteurId],
    queryFn: async () => (await api.get(`/secteurs/${secteurId}/zones`)).data,
    enabled: !!secteurId,
  });
}

export function useAddSecteurZone(secteurId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zoneId: number) => (await api.post(`/secteurs/${secteurId}/zones/${zoneId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteur-zones', secteurId] });
      qc.invalidateQueries({ queryKey: ['secteurs'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout de la zone');
    },
  });
}

export function useRemoveSecteurZone(secteurId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (zoneId: number) => (await api.delete(`/secteurs/${secteurId}/zones/${zoneId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteur-zones', secteurId] });
      qc.invalidateQueries({ queryKey: ['secteurs'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression de la zone');
    },
  });
}

export function useSecteurTypeVentes(secteurId: number | null) {
  return useQuery<TypeVente[]>({
    queryKey: ['secteur-type-ventes', secteurId],
    queryFn: async () => (await api.get(`/secteurs/${secteurId}/type-ventes`)).data,
    enabled: !!secteurId,
  });
}

export function useAddSecteurTypeVente(secteurId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (typeVenteId: number) => (await api.post(`/secteurs/${secteurId}/type-ventes/${typeVenteId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteur-type-ventes', secteurId] });
      qc.invalidateQueries({ queryKey: ['secteurs'] });
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajout du type de vente');
    },
  });
}

export function useRemoveSecteurTypeVente(secteurId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (typeVenteId: number) => (await api.delete(`/secteurs/${secteurId}/type-ventes/${typeVenteId}`)).data,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['secteur-type-ventes', secteurId] });
      qc.invalidateQueries({ queryKey: ['secteurs'] });
    },
    onError: () => {
      toast.error('Erreur lors de la suppression du type de vente');
    },
  });
}


