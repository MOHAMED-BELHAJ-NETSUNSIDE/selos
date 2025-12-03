'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Save, Loader2, ChevronsUpDown, Check } from 'lucide-react';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useCreateClient, useUpdateClient, CreateClientData, UpdateClientData } from '@/hooks/use-clients';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { useCanaux } from '@/hooks/use-canaux';
import { useLocalites } from '@/hooks/use-localites';
import { useTypeClients } from '@/hooks/use-type-clients';
import { useTypeVentes } from '@/hooks/use-type-ventes';

// Composant Combobox générique réutilisable
function Combobox({
  items,
  selectedId,
  onSelect,
  placeholder = "Sélectionner",
  searchPlaceholder = "Rechercher...",
  emptyMessage = "Aucun élément trouvé.",
}: {
  items: Array<{ id: number; nom: string }>;
  selectedId?: string;
  onSelect: (id: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const [open, setOpen] = useState(false);

  const selectedItem = items.find((item) => String(item.id) === selectedId);
  const displayValue = selectedItem ? selectedItem.nom : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {displayValue}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyMessage}</CommandEmpty>
            <CommandGroup>
              {items.map((item) => {
                const isSelected = selectedId === String(item.id);
                return (
                  <CommandItem
                    key={item.id}
                    value={item.nom}
                    onSelect={() => {
                      onSelect(String(item.id));
                      setOpen(false);
                    }}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        isSelected ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {item.nom}
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

const clientSchema = z.object({
  code: z.string().optional(),
  nom: z.string().min(2, 'Nom requis (min 2)'),
  nomCommercial: z.string().optional(),
  numeroTelephone: z.string().optional(),
  adresse: z.string().optional(),
  longitude: z.string().optional(),
  latitude: z.string().optional(),
  registreCommerce: z.string().optional(),
  typeClientId: z.string().optional(),
  typeVenteId: z.string().optional(),
  canalId: z.string().optional(),
  localiteId: z.string().optional(),
});

type ClientFormData = z.infer<typeof clientSchema>;

interface ClientFormProps {
  client?: any;
  onSuccess?: () => void;
}

export function ClientForm({ client, onSuccess }: ClientFormProps) {
  const isEditing = !!client;
  const { data: canaux = [] } = useCanaux();
  const { data: localites = [] } = useLocalites();
  const { data: typeClients = [] } = useTypeClients();
  const { data: typeVentes = [] } = useTypeVentes();

  const createClientMutation = useCreateClient();
  const updateClientMutation = useUpdateClient();

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      code: client?.code || '',
      nom: client?.nom || '',
      nomCommercial: client?.nomCommercial || '',
      numeroTelephone: client?.numeroTelephone || '',
      adresse: client?.adresse || '',
      longitude: client?.longitude ? String(client.longitude) : '',
      latitude: client?.latitude ? String(client.latitude) : '',
      registreCommerce: client?.registreCommerce || '',
      typeClientId: client?.typeClient?.id ? String(client.typeClient.id) : undefined,
      typeVenteId: client?.typeVente?.id ? String(client.typeVente.id) : undefined,
      canalId: client?.canal?.id ? String(client.canal.id) : undefined,
      localiteId: client?.localite?.id ? String(client.localite.id) : undefined,
    },
  });

  const onSubmit = async (data: ClientFormData) => {
    const payload: CreateClientData | UpdateClientData = {
      // Ne pas envoyer le code lors de la création (généré automatiquement)
      ...(isEditing && data.code ? { code: data.code } : {}),
      nom: data.nom,
      nomCommercial: data.nomCommercial || undefined,
      numeroTelephone: data.numeroTelephone || undefined,
      adresse: data.adresse || undefined,
      longitude: data.longitude && data.longitude.trim() !== '' ? parseFloat(data.longitude) : undefined,
      latitude: data.latitude && data.latitude.trim() !== '' ? parseFloat(data.latitude) : undefined,
      registreCommerce: data.registreCommerce || undefined,
      typeClientId: data.typeClientId ? Number(data.typeClientId) : undefined,
      typeVenteId: data.typeVenteId ? Number(data.typeVenteId) : undefined,
      canalId: data.canalId ? Number(data.canalId) : undefined,
      localiteId: data.localiteId ? Number(data.localiteId) : undefined,
    };
    if (isEditing) {
      await updateClientMutation.mutateAsync({ id: client.id, data: payload as UpdateClientData });
    } else {
      await createClientMutation.mutateAsync(payload as CreateClientData);
    }
    onSuccess?.();
  };

  const isLoading = createClientMutation.isPending || updateClientMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Informations générales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Informations générales</h3>
            <p className="text-sm text-muted-foreground">Informations de base du client</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {isEditing && (
              <FormField control={form.control} name="code" render={({ field }) => (
                <FormItem>
                  <FormLabel>Code</FormLabel>
                  <FormControl>
                    <Input placeholder="CLT0001" {...field} disabled />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />
            )}
            <FormField control={form.control} name="nom" render={({ field }) => (
              <FormItem className={isEditing ? '' : 'col-span-2'}>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder="Nom" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="nomCommercial" render={({ field }) => (
              <FormItem className={isEditing ? '' : 'col-span-2'}>
                <FormLabel>Nom commercial</FormLabel>
                <FormControl>
                  <Input placeholder="Nom commercial" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="numeroTelephone" render={({ field }) => (
              <FormItem className={isEditing ? '' : 'col-span-2'}>
                <FormLabel>Numéro de téléphone</FormLabel>
                <FormControl>
                  <Input placeholder="+216 71 123 456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <Separator />

        {/* Informations commerciales */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Informations commerciales</h3>
            <p className="text-sm text-muted-foreground">Détails commerciaux et juridiques</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="registreCommerce" render={({ field }) => (
              <FormItem>
                <FormLabel>Registre de commerce</FormLabel>
                <FormControl>
                  <Input placeholder="RC123456" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="typeClientId" render={({ field }) => (
              <FormItem>
                <FormLabel>Type client</FormLabel>
                <FormControl>
                  <Combobox
                    items={typeClients}
                    selectedId={field.value}
                    onSelect={field.onChange}
                    placeholder="Sélectionner un type client"
                    searchPlaceholder="Rechercher un type client..."
                    emptyMessage="Aucun type client trouvé."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="typeVenteId" render={({ field }) => (
              <FormItem>
                <FormLabel>Type de vente</FormLabel>
                <FormControl>
                  <Combobox
                    items={typeVentes}
                    selectedId={field.value}
                    onSelect={field.onChange}
                    placeholder="Sélectionner un type de vente"
                    searchPlaceholder="Rechercher un type de vente..."
                    emptyMessage="Aucun type de vente trouvé."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <Separator />

        {/* Localisation */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Localisation</h3>
            <p className="text-sm text-muted-foreground">Adresse et coordonnées géographiques</p>
          </div>
          <FormField control={form.control} name="adresse" render={({ field }) => (
            <FormItem>
              <FormLabel>Adresse</FormLabel>
              <FormControl>
                <Input placeholder="123 Rue Habib Bourguiba, Tunis" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )} />
          <div className="grid grid-cols-3 gap-4">
            <FormField control={form.control} name="localiteId" render={({ field }) => (
              <FormItem>
                <FormLabel>Localité</FormLabel>
                <FormControl>
                  <Combobox
                    items={localites}
                    selectedId={field.value}
                    onSelect={field.onChange}
                    placeholder="Sélectionner une localité"
                    searchPlaceholder="Rechercher une localité..."
                    emptyMessage="Aucune localité trouvée."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="longitude" render={({ field }) => (
              <FormItem>
                <FormLabel>Longitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="10.1815" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="latitude" render={({ field }) => (
              <FormItem>
                <FormLabel>Latitude</FormLabel>
                <FormControl>
                  <Input type="number" step="any" placeholder="36.8065" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <Separator />

        {/* Organisation */}
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Organisation</h3>
            <p className="text-sm text-muted-foreground">Affectation organisationnelle</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField control={form.control} name="canalId" render={({ field }) => (
              <FormItem>
                <FormLabel>Canal</FormLabel>
                <FormControl>
                  <Combobox
                    items={canaux}
                    selectedId={field.value}
                    onSelect={field.onChange}
                    placeholder="Sélectionner un canal"
                    searchPlaceholder="Rechercher un canal..."
                    emptyMessage="Aucun canal trouvé."
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )} />
          </div>
        </div>

        <Separator />

        <div className="flex justify-end space-x-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enregistrement...
              </>
            ) : isEditing ? (
              <>
                <Save className="mr-2 h-4 w-4" />
                Modifier
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Créer
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}


