# Pattern pour les hooks React Query avec invalidation des queries

## Règle générale

**Lorsqu'un hook a à la fois :**
- Un hook `useXxx(id)` pour récupérer les détails d'une entité
- Un hook `useUpdateXxx()` pour modifier une entité

**Alors `useUpdateXxx()` doit invalider :**
1. La query de la liste : `['xxx']` ou `['xxx', query]`
2. La query des détails : `['xxx', id]` (si elle existe)

## Pattern standardisé

```typescript
// Hook pour récupérer une entité spécifique
export function useXxx(id: number | string | null) {
  return useQuery({
    queryKey: ['xxx', id],
    queryFn: async () => {
      const res = await api.get(`/xxx/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

// Hook pour modifier une entité
export function useUpdateXxx() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, data }: { id: number | string; data: UpdateXxxData }) => {
      const res = await api.patch(`/xxx/${id}`, data);
      return res.data;
    },
    onSuccess: (_, variables) => {
      // Toujours invalider la liste
      qc.invalidateQueries({ queryKey: ['xxx'] });
      
      // Invalider les détails si le hook useXxx(id) existe
      qc.invalidateQueries({ queryKey: ['xxx', variables.id] });
      
      toast.success('Entité modifiée');
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });
}
```

## Hooks concernés (avec détails)

- ✅ `use-clients.ts` : `useClient(id)` + `useUpdateClient()`
- ✅ `use-users.ts` : `useUser(id)` + `useUpdateUser()` + `useToggleUserActive()`
- ✅ `use-roles.ts` : `useRole(id)` + `useUpdateRole()`
- ✅ `use-type-clients.ts` : `useTypeClient(id)` + `useUpdateTypeClient()`

## Hooks sans détails (pas besoin de modifier)

Ces hooks n'ont pas de hook `useXxx(id)`, donc pas besoin d'invalider les détails :
- `use-secteurs.ts`
- `use-regions.ts`
- `use-zones.ts`
- `use-canaux.ts`
- `use-type-ventes.ts`
- `use-localites.ts`
- `use-delegations.ts`
- `use-gouvernorats.ts`
- `use-sous-regions.ts`

## Note importante

Si un nouveau module est ajouté avec un drawer de détails, **il faut créer le hook `useXxx(id)` ET s'assurer que `useUpdateXxx()` invalide la query `['xxx', id]`**.


