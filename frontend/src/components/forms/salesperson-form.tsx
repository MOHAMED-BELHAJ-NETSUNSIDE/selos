'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCreateSalesperson, useUpdateSalesperson, type Salesperson, type CreateSalespersonData, type UpdateSalespersonData } from '@/hooks/use-salespersons';
import { useUsers } from '@/hooks/use-users';
import { useSalespersons } from '@/hooks/use-salespersons';
import { useBCLocations } from '@/hooks/use-bc-locations';
import { Save, XCircle, Loader2, Store } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useCanaux } from '@/hooks/use-canaux';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { useSecteurs } from '@/hooks/use-secteurs';

const salespersonSchemaBase = z.object({
  code: z.string().optional(),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  dateEmbauche: z.string().optional(),
  statut: z.string().optional(),
  login: z.string().min(3, 'Le login doit contenir au moins 3 caractères'),
  password: z.string().optional(),
  depotName: z.string().min(1, 'Le nom du dépôt est requis'),
  depotAdresse: z.string().optional(),
  depotTel: z.string().optional(),
  depotStatus: z.number().optional(),
  depotRemarque: z.string().optional(),
  bcLocationId: z.string().optional(),
  canalIds: z.array(z.number()).optional(),
  typeVenteIds: z.array(z.number()).optional(),
  secteurId: z.number().min(1, 'Le secteur est obligatoire'),
});

const salespersonSchemaCreate = salespersonSchemaBase.extend({
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});

const salespersonSchemaEdit = salespersonSchemaBase;

type SalespersonFormData = z.infer<typeof salespersonSchemaBase>;

interface SalespersonFormProps {
  salesperson?: Salesperson;
  isOpen: boolean;
  onClose: () => void;
  mode?: 'create' | 'edit';
}

export function SalespersonForm({ salesperson, isOpen, onClose, mode = salesperson ? 'edit' : 'create' }: SalespersonFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: usersData } = useUsers({ limit: 1000 });
  const { data: salespersonsData } = useSalespersons({ limit: 1000 });
  const { data: locationsData } = useBCLocations({ limit: 1000 });
  const locations = locationsData?.data || [];
  const { data: canaux = [] } = useCanaux();
  const { data: typeVentes = [] } = useTypeVentes();
  const { data: secteurs = [] } = useSecteurs();
  const createSalespersonMutation = useCreateSalesperson();
  const updateSalespersonMutation = useUpdateSalesperson();

  const isEditing = mode === 'edit' && !!salesperson;
  

  const dynamicSchema = useMemo(() => {
    return isEditing ? salespersonSchemaEdit : salespersonSchemaCreate;
  }, [isEditing]);

  const form = useForm<SalespersonFormData>({
    resolver: zodResolver(dynamicSchema),
      defaultValues: {
      code: salesperson?.code || '',
      telephone: salesperson?.telephone || '',
      adresse: salesperson?.adresse || '',
      dateEmbauche: salesperson?.dateEmbauche ? salesperson.dateEmbauche.split('T')[0] : '',
      statut: salesperson?.statut || 'actif',
      login: salesperson?.login || '',
      password: '',
      depotName: salesperson?.depotName || '',
      depotAdresse: salesperson?.depotAdresse || '',
      depotTel: salesperson?.depotTel || '',
      depotStatus: salesperson?.depotStatus ?? 1,
      depotRemarque: salesperson?.depotRemarque || '',
      bcLocationId: salesperson?.bcLocationId || '',
      canalIds: salesperson?.salespersonCanals?.map(sc => sc.canal.id) || [],
      typeVenteIds: salesperson?.salespersonTypeVentes?.map(stv => stv.typeVente.id) || [],
      secteurId: salesperson?.secteur?.id || 0,
    },
  });

  useEffect(() => {
    if (isEditing && salesperson) {
      form.reset({
        code: salesperson.code || '',
        telephone: salesperson.telephone || '',
        adresse: salesperson.adresse || '',
        dateEmbauche: salesperson.dateEmbauche ? salesperson.dateEmbauche.split('T')[0] : '',
        statut: salesperson.statut,
        login: salesperson.login,
        password: '',
        depotName: salesperson.depotName,
        depotAdresse: salesperson.depotAdresse || '',
        depotTel: salesperson.depotTel || '',
        depotStatus: salesperson.depotStatus,
        depotRemarque: salesperson.depotRemarque || '',
        bcLocationId: salesperson.bcLocationId || '',
        canalIds: salesperson.salespersonCanals?.map(sc => sc.canal.id) || [],
        typeVenteIds: salesperson.salespersonTypeVentes?.map(stv => stv.typeVente.id) || [],
        secteurId: salesperson.secteur?.id || 0,
      });
    } else {
      form.reset({
        code: '',
        telephone: '',
        adresse: '',
        dateEmbauche: '',
        statut: 'actif',
        login: '',
        password: '',
        depotName: '',
        depotAdresse: '',
        depotTel: '',
        depotStatus: 1,
        depotRemarque: '',
        bcLocationId: '',
        canalIds: [],
        typeVenteIds: [],
        secteurId: 0,
      });
    }
  }, [salesperson, isEditing, form]);

  // Debug: log pour vérifier les valeurs
  useEffect(() => {
    if (isEditing && salesperson) {
      console.log('Salesperson bcLocationId:', salesperson.bcLocationId);
      console.log('Form bcLocationId:', form.watch('bcLocationId'));
      console.log('Locations count:', locations.length);
      if (salesperson.bcLocationId) {
        const foundLocation = locations.find(loc => loc.bcId === salesperson.bcLocationId);
        console.log('Found location:', foundLocation);
      }
    }
  }, [salesperson, isEditing, form, locations.length]);

  const onSubmit = async (data: SalespersonFormData) => {
    setIsSubmitting(true);
    try {
      const submitData: any = {
        telephone: data.telephone || undefined,
        adresse: data.adresse || undefined,
        dateEmbauche: data.dateEmbauche || undefined,
        statut: data.statut || 'actif',
        login: data.login,
        ...(data.password && { password: data.password }),
        depotAdresse: data.depotAdresse || undefined,
        depotTel: data.depotTel || undefined,
        depotStatus: data.depotStatus ?? 1,
        depotRemarque: data.depotRemarque || undefined,
        bcLocationId: data.bcLocationId && data.bcLocationId !== '' ? data.bcLocationId : null,
        canalIds: data.canalIds && data.canalIds.length > 0 ? data.canalIds : undefined,
        typeVenteIds: data.typeVenteIds && data.typeVenteIds.length > 0 ? data.typeVenteIds : undefined,
        secteurId: data.secteurId || undefined,
      };

      if (isEditing && salesperson) {
        await updateSalespersonMutation.mutateAsync({ id: salesperson.id, data: submitData });
      } else {
        if (!data.password) {
          form.setError('password', { message: 'Le mot de passe est requis' });
          setIsSubmitting(false);
          return;
        }
        await createSalespersonMutation.mutateAsync(submitData as CreateSalespersonData);
      }
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Modifier le vendeur' : 'Créer un vendeur'}</DialogTitle>
          <DialogDescription>
            {isEditing ? 'Modifiez les informations du vendeur' : 'Remplissez les informations pour créer un nouveau vendeur'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Tabs defaultValue="informations" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="informations">Informations</TabsTrigger>
              <TabsTrigger value="logistique" className="flex items-center space-x-2">
                <Store className="h-4 w-4" />
                <span>Logistique</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informations" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="code">Code vendeur</Label>
                <Input id="code" {...form.register('code')} placeholder="VEN-001" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="login">Login (Selos Retails) *</Label>
                  <Input id="login" {...form.register('login')} placeholder="john.doe" />
                  {form.formState.errors.login && (
                    <p className="text-sm text-red-600">{form.formState.errors.login.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">
                    Mot de passe (Selos Retails) {isEditing ? '' : '*'}
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    {...form.register('password')}
                    placeholder={isEditing ? 'Laisser vide pour ne pas modifier' : 'password123'}
                  />
                  {form.formState.errors.password && (
                    <p className="text-sm text-red-600">{form.formState.errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" {...form.register('telephone')} placeholder="+216 12 345 678" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                  <Input id="dateEmbauche" type="date" {...form.register('dateEmbauche')} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input id="adresse" {...form.register('adresse')} placeholder="123 Rue Example, Tunis" />
              </div>

              <div className="space-y-2">
                <Label htmlFor="statut">Statut</Label>
                <Select
                  value={form.watch('statut') || 'actif'}
                  onValueChange={(value) => form.setValue('statut', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="actif">Actif</SelectItem>
                    <SelectItem value="inactif">Inactif</SelectItem>
                    <SelectItem value="suspendu">Suspendu</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-lg font-semibold mb-4">Informations du dépôt</h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="depotName">Nom du dépôt *</Label>
                    <Input id="depotName" {...form.register('depotName')} placeholder="Dépôt - John Doe" />
                    {form.formState.errors.depotName && (
                      <p className="text-sm text-red-600">{form.formState.errors.depotName.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="depotStatus">Statut du dépôt</Label>
                    <Select
                      value={String(form.watch('depotStatus') ?? 1)}
                      onValueChange={(value) => form.setValue('depotStatus', Number(value))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Actif</SelectItem>
                        <SelectItem value="0">Inactif</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="depotAdresse">Adresse du dépôt</Label>
                      <Input id="depotAdresse" {...form.register('depotAdresse')} placeholder="123 Rue Example" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="depotTel">Téléphone du dépôt</Label>
                      <Input id="depotTel" {...form.register('depotTel')} placeholder="+216 12 345 678" />
                    </div>
                  </div>


                  <div className="space-y-2">
                    <Label htmlFor="depotRemarque">Remarques</Label>
                    <Input id="depotRemarque" {...form.register('depotRemarque')} placeholder="Remarques sur le dépôt" />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="logistique" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="secteurId">
                  Secteur <span className="text-red-500">*</span>
                </Label>
                {secteurs.length === 0 ? (
                  <div className="text-sm text-muted-foreground p-2 border rounded-md">
                    Chargement des secteurs...
                  </div>
                ) : (
                  <Select
                    value={form.watch('secteurId') && form.watch('secteurId') > 0 ? String(form.watch('secteurId')) : ''}
                    onValueChange={(value) => {
                      if (value && value !== '') {
                        form.setValue('secteurId', Number(value), { shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger id="secteurId">
                      <SelectValue placeholder="Sélectionner un secteur" />
                    </SelectTrigger>
                    <SelectContent>
                      {secteurs.map((secteur) => (
                        <SelectItem key={secteur.id} value={String(secteur.id)}>
                          {secteur.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {form.formState.errors.secteurId && (
                  <p className="text-sm text-red-600">{form.formState.errors.secteurId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bcLocationId">Magasin (optionnel)</Label>
                <Select 
                  value={form.watch('bcLocationId') && form.watch('bcLocationId') !== '' ? form.watch('bcLocationId') : 'none'} 
                  onValueChange={(value) => {
                    if (value === 'none') {
                      form.setValue('bcLocationId', '');
                    } else {
                      form.setValue('bcLocationId', value);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un magasin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Aucun magasin</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location.id} value={location.bcId}>
                        {location.displayName || location.code || `Magasin ${location.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {form.watch('bcLocationId') && form.watch('bcLocationId') !== 'none' && form.watch('bcLocationId') !== '' && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Magasin sélectionné : {locations.find(loc => loc.bcId === form.watch('bcLocationId'))?.displayName || 
                                           locations.find(loc => loc.bcId === form.watch('bcLocationId'))?.code || 
                                           'Non trouvé'}
                  </p>
                )}
                {form.formState.errors.bcLocationId && (
                  <p className="text-sm text-red-600">{form.formState.errors.bcLocationId.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Canaux (sélection multiple)</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {canaux.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun canal disponible</p>
                  ) : (
                    canaux.map((canal) => {
                      const canalIds = form.watch('canalIds') || [];
                      const isChecked = canalIds.includes(canal.id);
                      return (
                        <div key={canal.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`canal-${canal.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentIds = form.watch('canalIds') || [];
                              if (checked) {
                                form.setValue('canalIds', [...currentIds, canal.id]);
                              } else {
                                form.setValue('canalIds', currentIds.filter(id => id !== canal.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`canal-${canal.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {canal.nom}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
                {form.watch('canalIds') && form.watch('canalIds')!.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch('canalIds')!.length} canal{form.watch('canalIds')!.length > 1 ? 'aux' : ''} sélectionné{form.watch('canalIds')!.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Types de vente (sélection multiple)</Label>
                <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                  {typeVentes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Aucun type de vente disponible</p>
                  ) : (
                    typeVentes.map((typeVente) => {
                      const typeVenteIds = form.watch('typeVenteIds') || [];
                      const isChecked = typeVenteIds.includes(typeVente.id);
                      return (
                        <div key={typeVente.id} className="flex items-center space-x-2">
                          <Checkbox
                            id={`typeVente-${typeVente.id}`}
                            checked={isChecked}
                            onCheckedChange={(checked) => {
                              const currentIds = form.watch('typeVenteIds') || [];
                              if (checked) {
                                form.setValue('typeVenteIds', [...currentIds, typeVente.id]);
                              } else {
                                form.setValue('typeVenteIds', currentIds.filter(id => id !== typeVente.id));
                              }
                            }}
                          />
                          <Label
                            htmlFor={`typeVente-${typeVente.id}`}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {typeVente.nom}
                          </Label>
                        </div>
                      );
                    })
                  )}
                </div>
                {form.watch('typeVenteIds') && form.watch('typeVenteIds')!.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    {form.watch('typeVenteIds')!.length} type{form.watch('typeVenteIds')!.length > 1 ? 's' : ''} de vente sélectionné{form.watch('typeVenteIds')!.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  {isEditing ? 'Modifier' : 'Créer'}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

