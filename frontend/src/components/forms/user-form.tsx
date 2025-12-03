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
import { useCreateUser, useUpdateUser, type User, type CreateUserData, type UpdateUserData } from '@/hooks/use-users';
import { useRoles } from '@/hooks/use-roles';
import { useTypeUsers } from '@/hooks/use-type-users';
import { useSecteurs } from '@/hooks/use-secteurs';
import { useRegions } from '@/hooks/use-regions';
import { useCanaux } from '@/hooks/use-canaux';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { useBCLocations } from '@/hooks/use-bc-locations';
import { Save, XCircle, Loader2, Store } from 'lucide-react';


const userSchemaBase = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  email: z.string().email('Email invalide'),
  roleId: z.string().min(1, 'Le rôle est requis'),
  typeUserId: z.string().optional(),
  password: z.string().optional(),
  secteurId: z.string().optional(),
  regionId: z.string().optional(),
  canalId: z.string().optional(),
  typeVenteId: z.string().optional(),
  bcLocationId: z.string().optional(),
});

const userSchemaCreate = userSchemaBase.extend({
  password: z.string().min(6, 'Mot de passe requis (min 6)'),
  typeUserId: z.string().min(1, 'Le type utilisateur est requis'),
});

const userSchemaEdit = userSchemaBase; // password & typeUserId optionnels en édition

type UserFormData = z.infer<typeof userSchemaBase>;

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
  mode?: 'create' | 'edit';
}

export function UserForm({ user, onSuccess, mode = user ? 'edit' : 'create' }: UserFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: roles = [] } = useRoles();
  const { data: typeUsers = [] } = useTypeUsers();
  const { data: secteurs = [] } = useSecteurs();
  const { data: regions = [] } = useRegions();
  const { data: canaux = [] } = useCanaux();
  const { data: typeVentes = [] } = useTypeVentes();
  const { data: locationsData } = useBCLocations();
  const locations = locationsData?.data || [];
  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const isEditing = mode === 'edit' && !!user;
  
  // Create dynamic schema with conditional validation for salesperson
  const dynamicSchema = useMemo(() => {
    const baseSchema = isEditing ? userSchemaEdit : userSchemaCreate;
    return baseSchema.refine((data) => {
      if (!data.typeUserId) return true;
      const typeUser = typeUsers.find(tu => String(tu.id) === data.typeUserId);
      if (typeUser && typeUser.nom.toLowerCase() === 'salesperson') {
        return !!data.secteurId && !!data.canalId && !!data.typeVenteId;
      }
      return true;
    }, {
      message: 'Le secteur, le canal et le type de vente sont obligatoires pour le type utilisateur "salesperson"',
      path: ['secteurId'],
    }).refine((data) => {
      if (!data.typeUserId) return true;
      const typeUser = typeUsers.find(tu => String(tu.id) === data.typeUserId);
      if (typeUser && typeUser.nom.toLowerCase() === 'salesperson') {
        return !!data.secteurId && !!data.canalId && !!data.typeVenteId;
      }
      return true;
    }, {
      message: 'Le secteur, le canal et le type de vente sont obligatoires pour le type utilisateur "salesperson"',
      path: ['canalId'],
    }).refine((data) => {
      if (!data.typeUserId) return true;
      const typeUser = typeUsers.find(tu => String(tu.id) === data.typeUserId);
      if (typeUser && typeUser.nom.toLowerCase() === 'salesperson') {
        return !!data.secteurId && !!data.canalId && !!data.typeVenteId;
      }
      return true;
    }, {
      message: 'Le secteur, le canal et le type de vente sont obligatoires pour le type utilisateur "salesperson"',
      path: ['typeVenteId'],
    });
  }, [isEditing, typeUsers]);
  
  const resolver = useMemo(() => zodResolver(dynamicSchema), [dynamicSchema]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<UserFormData>({
    resolver,
    defaultValues: {
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      password: '',
      roleId: (user as any)?.roleId || '',
      typeUserId: user?.typeUserId ? String(user.typeUserId) : undefined,
      secteurId: user?.secteurId ? String(user.secteurId) : undefined,
      regionId: user?.regionId ? String(user.regionId) : undefined,
      canalId: user?.canalId ? String(user.canalId) : undefined,
      typeVenteId: user?.typeVenteId ? String(user.typeVenteId) : undefined,
      bcLocationId: user?.bcLocationId ? String(user.bcLocationId) : undefined,
    },
  });

  const selectedRoleId = watch('roleId');
  const selectedTypeUserId = watch('typeUserId');
  const selectedSecteurId = watch('secteurId');
  const selectedRegionId = watch('regionId');
  const selectedCanalId = watch('canalId');
  const selectedTypeVenteId = watch('typeVenteId');
  const selectedBcLocationId = watch('bcLocationId');

  // Check if selected type user is salesperson
  const isSalesperson = useMemo(() => {
    if (!selectedTypeUserId) return false;
    const typeUser = typeUsers.find(tu => String(tu.id) === selectedTypeUserId);
    return typeUser?.nom.toLowerCase() === 'salesperson';
  }, [selectedTypeUserId, typeUsers]);

  useEffect(() => {
    if (user && isEditing) {
      setValue('firstName', user.firstName);
      setValue('lastName', user.lastName);
      setValue('email', user.email);
      // @ts-ignore optional field on type
      setValue('roleId', (user as any).roleId || (user.role?.id ?? ''));
      setValue('typeUserId', user.typeUserId ? String(user.typeUserId) : undefined);
      setValue('secteurId', user.secteurId ? String(user.secteurId) : undefined);
      setValue('regionId', user.regionId ? String(user.regionId) : undefined);
      setValue('canalId', user.canalId ? String(user.canalId) : undefined);
      setValue('typeVenteId', user.typeVenteId ? String(user.typeVenteId) : undefined);
      setValue('bcLocationId', user.bcLocationId ? String(user.bcLocationId) : undefined);
    } else {
      reset();
    }
  }, [user, isEditing, setValue, reset]);

  const onSubmit = async (data: UserFormData) => {
    setIsSubmitting(true);
    try {
      if (!isEditing) {
        const createData: CreateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          password: data.password!,
          roleId: data.roleId,
          typeUserId: Number(data.typeUserId!),
          secteurId: data.secteurId ? Number(data.secteurId) : undefined,
          regionId: data.regionId ? Number(data.regionId) : undefined,
          canalId: data.canalId ? Number(data.canalId) : undefined,
          typeVenteId: data.typeVenteId ? Number(data.typeVenteId) : undefined,
          bcLocationId: data.bcLocationId && data.bcLocationId !== '' ? data.bcLocationId : undefined,
        };
        await createUserMutation.mutateAsync(createData);
      } else if (user) {
        const updateData: UpdateUserData = {
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
          roleId: data.roleId,
          typeUserId: data.typeUserId ? Number(data.typeUserId) : undefined,
          password: data.password ? data.password : undefined,
          secteurId: data.secteurId ? Number(data.secteurId) : undefined,
          regionId: data.regionId ? Number(data.regionId) : undefined,
          canalId: data.canalId ? Number(data.canalId) : undefined,
          typeVenteId: data.typeVenteId ? Number(data.typeVenteId) : undefined,
          bcLocationId: data.bcLocationId && data.bcLocationId !== '' ? data.bcLocationId : undefined,
        };
        await updateUserMutation.mutateAsync({ id: user.id, data: updateData });
      }
      onSuccess?.();
      reset();
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <Tabs defaultValue="informations" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="informations">Informations</TabsTrigger>
          <TabsTrigger value="logistique" className="flex items-center space-x-2">
            <Store className="h-4 w-4" />
            <span>Logistique</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="informations" className="space-y-6 mt-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Prénom</Label>
              <Input id="firstName" {...register('firstName')} placeholder="Prénom" />
              {errors.firstName && (
                <p className="text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Nom</Label>
              <Input id="lastName" {...register('lastName')} placeholder="Nom" />
              {errors.lastName && (
                <p className="text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" {...register('email')} placeholder="email@example.com" />
            {errors.email && (
              <p className="text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {!isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <Input id="password" type="password" {...register('password')} placeholder="Mot de passe" />
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>
          )}

          {isEditing && (
            <div className="space-y-2">
              <Label htmlFor="password">Nouveau mot de passe (optionnel)</Label>
              <Input id="password" type="password" {...register('password')} placeholder="Laisser vide pour ne pas changer" />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="roleId">Rôle</Label>
            <Select value={selectedRoleId} onValueChange={(value) => setValue('roleId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.roleId && (
              <p className="text-sm text-red-600">{errors.roleId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeUserId">Type utilisateur</Label>
            <Select value={selectedTypeUserId} onValueChange={(value) => setValue('typeUserId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un type" />
              </SelectTrigger>
              <SelectContent>
                {typeUsers.map((tu) => (
                  <SelectItem key={tu.id} value={String(tu.id)}>
                    {tu.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isEditing && errors.typeUserId && (
              <p className="text-sm text-red-600">{errors.typeUserId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secteurId">
              Secteur {isSalesperson && <span className="text-red-600">*</span>}
              {!isSalesperson && <span className="text-gray-500">(optionnel)</span>}
            </Label>
            <Select value={selectedSecteurId} onValueChange={(value) => setValue('secteurId', value)}>
              <SelectTrigger className={errors.secteurId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner un secteur" />
              </SelectTrigger>
              <SelectContent>
                {secteurs.map((s) => (
                  <SelectItem key={s.id} value={String(s.id)}>
                    {s.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.secteurId && (
              <p className="text-sm text-red-600">{errors.secteurId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="regionId">Région (optionnel)</Label>
            <Select value={selectedRegionId} onValueChange={(value) => setValue('regionId', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une région" />
              </SelectTrigger>
              <SelectContent>
                {regions.map((r) => (
                  <SelectItem key={r.id} value={String(r.id)}>
                    {r.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="canalId">
              Canal {isSalesperson && <span className="text-red-600">*</span>}
              {!isSalesperson && <span className="text-gray-500">(optionnel)</span>}
            </Label>
            <Select value={selectedCanalId} onValueChange={(value) => setValue('canalId', value)}>
              <SelectTrigger className={errors.canalId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner un canal" />
              </SelectTrigger>
              <SelectContent>
                {canaux.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.canalId && (
              <p className="text-sm text-red-600">{errors.canalId.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="typeVenteId">
              Type de vente {isSalesperson && <span className="text-red-600">*</span>}
              {!isSalesperson && <span className="text-gray-500">(optionnel)</span>}
            </Label>
            <Select value={selectedTypeVenteId} onValueChange={(value) => setValue('typeVenteId', value)}>
              <SelectTrigger className={errors.typeVenteId ? 'border-red-500' : ''}>
                <SelectValue placeholder="Sélectionner un type de vente" />
              </SelectTrigger>
              <SelectContent>
                {typeVentes.map((tv) => (
                  <SelectItem key={tv.id} value={String(tv.id)}>
                    {tv.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.typeVenteId && (
              <p className="text-sm text-red-600">{errors.typeVenteId.message}</p>
            )}
          </div>
        </TabsContent>

        <TabsContent value="logistique" className="space-y-6 mt-6">
          <div className="space-y-2">
            <Label htmlFor="bcLocationId">Magasin (optionnel)</Label>
            <Select 
              value={selectedBcLocationId || 'none'} 
              onValueChange={(value) => {
                if (value === 'none') {
                  setValue('bcLocationId', '');
                } else {
                  setValue('bcLocationId', value);
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
            {errors.bcLocationId && (
              <p className="text-sm text-red-600">{errors.bcLocationId.message}</p>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end space-x-2 mt-6">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
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
  );
}
