'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerFooter } from '@/components/ui/drawer';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, Search, MoreHorizontal, Edit, Trash2, Loader2, ChevronLeft, ChevronRight, XCircle, Save, Store, User, Key, CalendarDays } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useCanaux } from '@/hooks/use-canaux';
import { useTypeVentes } from '@/hooks/use-type-ventes';
import { useSecteurs, type Secteur } from '@/hooks/use-secteurs';
import { useSalespersons, useDeleteSalesperson, useCreateSalesperson, useUpdateSalesperson, useSalesperson, type Salesperson } from '@/hooks/use-salespersons';
import { useCircuitCommercial } from '@/hooks/use-circuit-commercial';
import { useZones } from '@/hooks/use-zones';
import { useBCCustomers } from '@/hooks/use-bc-customers';
import { useBCLocations } from '@/hooks/use-bc-locations';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SalespersonsPage() {
  const { data: salespersonsData, isLoading, error } = useSalespersons({ limit: 1000 });
  const createMutation = useCreateSalesperson();
  const updateMutation = useUpdateSalesperson();
  const deleteMutation = useDeleteSalesperson();

  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 10;

  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Salesperson | null>(null);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [calendrierVisiteOpen, setCalendrierVisiteOpen] = useState(false);
  const [viewingSecteur, setViewingSecteur] = useState<Secteur | null>(null);
  
  // Récupérer les détails complets du vendeur en consultation
  const { data: viewingSalesperson, isLoading: isLoadingViewing } = useSalesperson(viewingId || 0);
  
  // Form states
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('');
  const [dateEmbauche, setDateEmbauche] = useState('');
  const [statut, setStatut] = useState('actif');
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [depotAdresse, setDepotAdresse] = useState('');
  const [depotTel, setDepotTel] = useState('');
  const [depotStatus, setDepotStatus] = useState<number>(1);
  const [depotRemarque, setDepotRemarque] = useState('');
  const [bcCustomerId, setBcCustomerId] = useState<string | null>(null);
  const [bcCustomerSearch, setBcCustomerSearch] = useState('');
  const [tva, setTva] = useState('');
  const [bcComboboxOpen, setBcComboboxOpen] = useState(false);
  const [bcLocationId, setBcLocationId] = useState<string | null>(null);
  const [secteurId, setSecteurId] = useState<number | undefined>(undefined);
  const [canalIds, setCanalIds] = useState<number[]>([]);
  const [typeVenteIds, setTypeVenteIds] = useState<number[]>([]);

  const { data: bcCustomersData } = useBCCustomers({ search: bcCustomerSearch, limit: 100 });
  const bcCustomers = bcCustomersData?.data || [];
  const { data: locationsData } = useBCLocations();
  const locations = locationsData?.data || [];
  const { data: canaux = [] } = useCanaux();
  const { data: typeVentes = [] } = useTypeVentes();
  const { data: secteurs = [] } = useSecteurs();
  
  const selectedCustomer = bcCustomers.find(c => c.bcId === bcCustomerId);
  
  const salespersons = salespersonsData?.data || [];
  
  // Récupérer les clients BC déjà utilisés par d'autres vendeurs
  const usedBCCustomerIds = new Set(
    salespersons
      .filter(s => s.bcCustomerId && (!editing || s.id !== editing.id))
      .map(s => s.bcCustomerId!)
  );
  
  // Filtrer les clients BC disponibles (non utilisés ou celui du vendeur en cours d'édition)
  const availableBCCustomers = bcCustomers.filter(c => 
    !c.blocked && (!usedBCCustomerIds.has(c.bcId) || (editing && bcCustomerId === c.bcId))
  );

  // Fonction pour pré-remplir les champs depuis le client BC sélectionné
  const handleBCCustomerChange = (bcId: string) => {
    const customer = bcCustomers.find(c => c.bcId === bcId);
    if (customer) {
      setBcCustomerId(bcId);
      // Parser le displayName pour obtenir firstName et lastName
      if (customer.displayName) {
        const nameParts = customer.displayName.trim().split(/\s+/);
        if (nameParts.length >= 2) {
          setFirstName(nameParts[0]);
          setLastName(nameParts.slice(1).join(' '));
        } else if (nameParts.length === 1) {
          setFirstName('');
          setLastName(nameParts[0]);
        }
      }
      setTelephone(customer.phoneNumber || '');
      setTva(customer.taxRegistrationNumber || '');
      setEmail(customer.email || '');
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const items = q 
      ? salespersons.filter((s) => 
          s.code?.toLowerCase().includes(q) ||
          s.login.toLowerCase().includes(q) ||
          s.depotName.toLowerCase().includes(q) ||
          s.firstName.toLowerCase().includes(q) ||
          s.lastName.toLowerCase().includes(q) ||
          s.email?.toLowerCase().includes(q) ||
          String(s.id).includes(q)
        )
      : salespersons;
    const start = (page - 1) * limit;
    return { 
      items: items.slice(start, start + limit), 
      total: items.length, 
      pages: Math.max(1, Math.ceil(items.length / limit)) 
    };
  }, [salespersons, search, page]);

  const openCreate = () => {
    setEditing(null);
    setFirstName('');
    setLastName('');
    setEmail('');
    setTelephone('');
    setAdresse('');
    setDateEmbauche('');
    setStatut('actif');
    setLogin('');
    setPassword('');
    setDepotAdresse('');
    setDepotTel('');
    setDepotStatus(1);
    setDepotRemarque('');
    setBcCustomerId(null);
    setBcCustomerSearch('');
    setTva('');
    setBcLocationId(null);
    setSecteurId(undefined);
    setCanalIds([]);
    setTypeVenteIds([]);
    setIsOpen(true);
  };

  const openEdit = (s: Salesperson) => {
    setEditing(s);
    setFirstName(s.firstName);
    setLastName(s.lastName);
    setEmail(s.email || '');
    setTelephone(s.telephone || '');
    setAdresse(s.adresse || '');
    setDateEmbauche(s.dateEmbauche ? s.dateEmbauche.split('T')[0] : '');
    setStatut(s.statut);
    setLogin(s.login);
    setPassword('');
    setDepotAdresse(s.depotAdresse || '');
    setDepotTel(s.depotTel || '');
    setCanalIds(s.salespersonCanals?.map(sc => sc.canal.id) || []);
    setTypeVenteIds(s.salespersonTypeVentes?.map(stv => stv.typeVente.id) || []);
    setDepotStatus(s.depotStatus);
    setDepotRemarque(s.depotRemarque || '');
    setBcCustomerId(s.bcCustomerId || null);
    setBcCustomerSearch('');
    setTva((s as any).tva || '');
    setBcLocationId(s.bcLocationId || null);
    setSecteurId(s.secteur?.id || undefined);
    setBcComboboxOpen(false);
    setIsOpen(true);
  };

  const handleSave = async () => {
    try {
      if (!bcCustomerId) {
        alert('Le client Business Central est obligatoire');
        return;
      }
      if (!login.trim()) {
        alert('Le login est requis');
        return;
      }
      if (!editing && !password.trim()) {
        alert('Le mot de passe est requis');
        return;
      }
      if (!secteurId) {
        alert('Le secteur est obligatoire');
        return;
      }

      const data: any = {
        // firstName, lastName, email, telephone sont récupérés automatiquement depuis BC
        // On ne les envoie pas, le backend les récupère depuis le client BC
        adresse: adresse || undefined,
        dateEmbauche: dateEmbauche || undefined,
        statut: statut || 'actif',
        login,
        depotAdresse: depotAdresse || undefined,
        depotTel: depotTel || undefined,
        depotStatus: depotStatus ?? 1,
        depotRemarque: depotRemarque || undefined,
        bcCustomerId: bcCustomerId,
        bcLocationId: bcLocationId,
        secteurId: secteurId,
        canalIds: canalIds.length > 0 ? canalIds : undefined,
        typeVenteIds: typeVenteIds.length > 0 ? typeVenteIds : undefined,
      };

      if (editing) {
        if (password.trim()) {
          data.password = password;
        }
        await updateMutation.mutateAsync({ id: editing.id, data });
      } else {
        data.password = password;
        await createMutation.mutateAsync(data);
      }
      setIsOpen(false);
      setEditing(null);
    } catch (error) {
      console.error('Error saving salesperson:', error);
    }
  };

  const handleDelete = async (s: Salesperson) => {
    if (!confirm('Supprimer ce vendeur ?')) return;
    await deleteMutation.mutateAsync(s.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-900">Vendeurs</h1>
          <p className="text-gray-600 dark:text-gray-900">Gérez les vendeurs</p>
        </div>
        <Button onClick={openCreate}><Plus className="mr-2 h-4 w-4"/>Ajouter</Button>
      </div>

      <Card>
        <div className="flex items-center space-x-4 p-6 pb-2">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Rechercher un vendeur..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="pl-10" />
            </div>
          </div>
        </div>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin"/><span className="ml-2">Chargement...</span></div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-red-600 font-semibold mb-2">Erreur lors du chargement</div>
              <div className="text-sm text-gray-500">{error instanceof Error ? error.message : 'Une erreur est survenue'}</div>
            </div>
          ) : filtered.total === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500 mb-2">Aucun vendeur trouvé</div>
              {salespersons.length === 0 && (
                <div className="text-sm text-gray-400 mt-2">La base de données ne contient aucun vendeur. Cliquez sur "Ajouter" pour en créer un.</div>
              )}
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Code</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Client BC</TableHead>
                    <TableHead>Code BC</TableHead>
                    <TableHead>Secteur</TableHead>
                    <TableHead>Magasin</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.items.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.id}</TableCell>
                      <TableCell>{s.code || '—'}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{s.firstName} {s.lastName}</div>
                          {s.email && <div className="text-sm text-gray-500">{s.email}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {s.bcCustomer ? (
                          <div>
                            <div className="font-medium">{s.bcCustomer.displayName || s.bcCustomerId}</div>
                            {s.bcCustomer.number && <div className="text-xs text-gray-500">#{s.bcCustomer.number}</div>}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.bcCode ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {s.bcCode}
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.secteur ? (
                          <span className="font-medium">{s.secteur.nom}</span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {s.bcLocation ? (
                          <div className="flex items-center space-x-2">
                            <Store className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{s.bcLocation.displayName || s.bcLocation.code || `Magasin ${s.bcLocation.id}`}</span>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          s.statut === 'actif'
                            ? 'bg-green-100 text-green-800'
                            : s.statut === 'suspendu'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {s.statut}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => { setViewingId(s.id); setIsViewOpen(true); }}><Search className="mr-2 h-4 w-4"/>Consulter</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(s)}><Edit className="mr-2 h-4 w-4"/>Modifier</DropdownMenuItem>
                            {s.secteur && (
                              <DropdownMenuItem onClick={() => { setViewingSecteur(s.secteur!); setCalendrierVisiteOpen(true); }}>
                                <CalendarDays className="mr-2 h-4 w-4"/>Calendrier de visite
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem className="text-red-600" onClick={() => handleDelete(s)}><Trash2 className="mr-2 h-4 w-4"/>Supprimer</DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filtered.pages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-gray-500">Page {page} sur {filtered.pages}</div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Précédent
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(filtered.pages, p + 1))} disabled={page === filtered.pages}>
                      Suivant
                      <ChevronRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Drawer open={isOpen} onOpenChange={(open) => {
        setIsOpen(open);
        if (!open) {
          setEditing(null);
          setFirstName('');
          setLastName('');
          setEmail('');
          setTelephone('');
          setAdresse('');
          setDateEmbauche('');
          setStatut('actif');
          setLogin('');
          setPassword('');
          setDepotAdresse('');
          setDepotTel('');
          setDepotStatus(1);
          setDepotRemarque('');
          setBcCustomerId(null);
          setBcCustomerSearch('');
          setTva('');
          setBcLocationId(null);
          setCanalIds([]);
          setTypeVenteIds([]);
          setBcComboboxOpen(false);
        }
      }}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>{editing ? 'Modifier' : 'Ajouter'} un vendeur</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <Tabs defaultValue="vendeur" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="vendeur" className="flex items-center space-x-2">
                  <User className="h-4 w-4" />
                  <span>Informations du vendeur</span>
                </TabsTrigger>
                <TabsTrigger value="connexion" className="flex items-center space-x-2">
                  <Key className="h-4 w-4" />
                  <span>Connexion</span>
                </TabsTrigger>
                <TabsTrigger value="logistique" className="flex items-center space-x-2">
                  <Store className="h-4 w-4" />
                  <span>Logistique</span>
                </TabsTrigger>
              </TabsList>

              {/* Onglet 1 : Informations du vendeur */}
              <TabsContent value="vendeur" className="mt-4 space-y-6">
                {/* Section Client Business Central */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-semibold">Client Business Central <span className="text-red-500">*</span></h3>
                  <div className="space-y-2">
                    <Label htmlFor="bcCustomer">Sélectionner un client BC</Label>
                    <Popover open={bcComboboxOpen} onOpenChange={setBcComboboxOpen}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={bcComboboxOpen}
                          className="w-full justify-between"
                        >
                          {selectedCustomer
                            ? `${selectedCustomer.displayName || selectedCustomer.number || selectedCustomer.bcId}${selectedCustomer.number ? ` (#${selectedCustomer.number})` : ''}`
                            : "Sélectionner un client BC..."}
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0" align="start">
                        <Command>
                          <CommandInput 
                            placeholder="Rechercher un client BC..." 
                            value={bcCustomerSearch}
                            onValueChange={setBcCustomerSearch}
                          />
                          <CommandList>
                            <CommandEmpty>Aucun client trouvé.</CommandEmpty>
                            <CommandGroup>
                              {availableBCCustomers.map((customer) => (
                                  <CommandItem
                                    key={customer.bcId}
                                    value={`${customer.displayName || ''} ${customer.number || ''} ${customer.bcId}`}
                                    onSelect={() => {
                                      handleBCCustomerChange(customer.bcId);
                                      setBcComboboxOpen(false);
                                    }}
                                  >
                                    <Check
                                      className={cn(
                                        "mr-2 h-4 w-4",
                                        bcCustomerId === customer.bcId ? "opacity-100" : "opacity-0"
                                      )}
                                    />
                                    <div className="flex flex-col">
                                      <span>{customer.displayName || customer.number || customer.bcId}</span>
                                      {customer.number && (
                                        <span className="text-xs text-muted-foreground">#{customer.number}</span>
                                      )}
                                    </div>
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    {bcCustomerId && selectedCustomer && (
                      <div className="mt-2 p-2 bg-blue-50 rounded text-sm">
                        <strong>Client sélectionné :</strong>{' '}
                        {selectedCustomer.displayName || selectedCustomer.number || bcCustomerId}
                        {selectedCustomer.number && ` (#${selectedCustomer.number})`}
                      </div>
                    )}
                  </div>
                </div>

                {/* Section Informations personnelles */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-semibold">Informations personnelles</h3>
                  <p className="text-sm text-gray-500 mb-4">Ces champs sont récupérés automatiquement depuis le client BC sélectionné et ne sont pas modifiables</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">Prénom</Label>
                      <Input 
                        id="firstName" 
                        value={firstName} 
                        disabled 
                        className="bg-gray-50 cursor-not-allowed" 
                        placeholder="Récupéré depuis BC" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Nom</Label>
                      <Input 
                        id="lastName" 
                        value={lastName} 
                        disabled 
                        className="bg-gray-50 cursor-not-allowed" 
                        placeholder="Récupéré depuis BC" 
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={email} 
                        disabled 
                        className="bg-gray-50 cursor-not-allowed" 
                        placeholder="Récupéré depuis BC" 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="telephone">Téléphone</Label>
                      <Input 
                        id="telephone" 
                        value={telephone} 
                        disabled 
                        className="bg-gray-50 cursor-not-allowed" 
                        placeholder="Récupéré depuis BC" 
                      />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="tva">Numéro TVA</Label>
                    <Input 
                      id="tva" 
                      value={tva} 
                      disabled 
                      className="bg-gray-50 cursor-not-allowed" 
                      placeholder="Récupéré automatiquement depuis BC" 
                    />
                  </div>
                </div>

                {/* Section Informations complémentaires */}
                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-semibold">Informations complémentaires</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="statut">Statut</Label>
                      <Select value={statut} onValueChange={setStatut}>
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
                    <div className="space-y-2">
                      <Label htmlFor="dateEmbauche">Date d'embauche</Label>
                      <Input id="dateEmbauche" type="date" value={dateEmbauche} onChange={(e) => setDateEmbauche(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2 mt-4">
                    <Label htmlFor="adresse">Adresse</Label>
                    <Input id="adresse" value={adresse} onChange={(e) => setAdresse(e.target.value)} placeholder="123 Rue Example, Tunis" />
                  </div>
                </div>
              </TabsContent>

              {/* Onglet 2 : Connexion */}
              <TabsContent value="connexion" className="mt-4 space-y-4">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Connexion Selos Retails</h3>
                  <p className="text-sm text-gray-500">Identifiants de connexion pour l'application Selos Retails</p>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="login">Login <span className="text-red-500">*</span></Label>
                      <Input 
                        id="login" 
                        value={login} 
                        onChange={(e) => setLogin(e.target.value)} 
                        placeholder="john.doe" 
                      />
                      <p className="text-xs text-gray-500">Identifiant unique pour se connecter à Selos Retails</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="password">
                        Mot de passe {editing ? '' : <span className="text-red-500">*</span>}
                      </Label>
                      <Input 
                        id="password" 
                        type="password" 
                        value={password} 
                        onChange={(e) => setPassword(e.target.value)} 
                        placeholder={editing ? 'Laisser vide pour ne pas modifier' : 'password123'} 
                      />
                      <p className="text-xs text-gray-500">
                        {editing ? 'Laisser vide pour conserver le mot de passe actuel' : 'Minimum 6 caractères'}
                      </p>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Onglet 3 : Logistique */}
              <TabsContent value="logistique" className="mt-4 space-y-6">
                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-semibold">Secteur</h3>
                  <p className="text-sm text-gray-500">Sélectionner le secteur du vendeur</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="secteurId">
                      Secteur <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={secteurId ? String(secteurId) : ''}
                      onValueChange={(value) => {
                        if (value && value !== '') {
                          setSecteurId(Number(value));
                        } else {
                          setSecteurId(undefined);
                        }
                      }}
                    >
                      <SelectTrigger id="secteurId">
                        <SelectValue placeholder="Sélectionner un secteur" />
                      </SelectTrigger>
                      <SelectContent>
                        {secteurs.length === 0 ? (
                          <SelectItem value="" disabled>Aucun secteur disponible</SelectItem>
                        ) : (
                          secteurs.map((secteur) => (
                            <SelectItem key={secteur.id} value={String(secteur.id)}>
                              {secteur.nom}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-semibold">Magasin</h3>
                  <p className="text-sm text-gray-500">Affecter un magasin au vendeur</p>
                  
                  <div className="space-y-2">
                    <Label htmlFor="bcLocationId">Magasin (optionnel)</Label>
                    <Select 
                      value={bcLocationId ? String(bcLocationId) : 'none'} 
                      onValueChange={(value) => {
                        if (value === 'none') {
                          setBcLocationId(null);
                        } else {
                          setBcLocationId(value);
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
                  </div>
                </div>

                <div className="space-y-4 border-b pb-4">
                  <h3 className="text-lg font-semibold">Canaux (sélection multiple)</h3>
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {canaux.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun canal disponible</p>
                    ) : (
                      canaux.map((canal) => {
                        const isChecked = canalIds.includes(canal.id);
                        return (
                          <div key={canal.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`canal-${canal.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setCanalIds([...canalIds, canal.id]);
                                } else {
                                  setCanalIds(canalIds.filter(id => id !== canal.id));
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
                  {canalIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {canalIds.length} canal{canalIds.length > 1 ? 'aux' : ''} sélectionné{canalIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Types de vente (sélection multiple)</h3>
                  <div className="border rounded-md p-4 space-y-2 max-h-48 overflow-y-auto">
                    {typeVentes.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Aucun type de vente disponible</p>
                    ) : (
                      typeVentes.map((typeVente) => {
                        const isChecked = typeVenteIds.includes(typeVente.id);
                        return (
                          <div key={typeVente.id} className="flex items-center space-x-2">
                            <Checkbox
                              id={`typeVente-${typeVente.id}`}
                              checked={isChecked}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  setTypeVenteIds([...typeVenteIds, typeVente.id]);
                                } else {
                                  setTypeVenteIds(typeVenteIds.filter(id => id !== typeVente.id));
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
                  {typeVenteIds.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {typeVenteIds.length} type{typeVenteIds.length > 1 ? 's' : ''} de vente sélectionné{typeVenteIds.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              <XCircle className="mr-2 h-4 w-4" />
              Annuler
            </Button>
            <Button onClick={handleSave} disabled={createMutation.isPending || updateMutation.isPending}>
              {createMutation.isPending || updateMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enregistrement...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Enregistrer
                </>
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer de consultation */}
      <Drawer open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DrawerContent 
          side="right" 
          className="h-full flex flex-col"
          style={{ width: '60vw', maxWidth: '60vw' }}
        >
          <DrawerHeader>
            <DrawerTitle>Détails du vendeur</DrawerTitle>
          </DrawerHeader>
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {isLoadingViewing ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Chargement...</span>
              </div>
            ) : viewingSalesperson ? (
              <Tabs defaultValue="vendeur" className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="vendeur" className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>Informations du vendeur</span>
                  </TabsTrigger>
                  <TabsTrigger value="connexion" className="flex items-center space-x-2">
                    <Key className="h-4 w-4" />
                    <span>Connexion</span>
                  </TabsTrigger>
                  <TabsTrigger value="logistique" className="flex items-center space-x-2">
                    <Store className="h-4 w-4" />
                    <span>Logistique</span>
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="vendeur" className="mt-4 space-y-6">
                  {/* Client Business Central */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Client Business Central</h3>
                    {viewingSalesperson.bcCustomer ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Nom du client</p>
                          <p className="text-base">{viewingSalesperson.bcCustomer.displayName || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Numéro BC</p>
                          <p className="text-base">{viewingSalesperson.bcCustomer.number || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Email</p>
                          <p className="text-base">{viewingSalesperson.bcCustomer.email || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                          <p className="text-base">{viewingSalesperson.bcCustomer.phoneNumber || '—'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">Aucun client Business Central assigné</p>
                    )}
                  </div>

                  {/* Informations personnelles */}
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Informations personnelles</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Prénom</p>
                        <p className="text-base">{viewingSalesperson.firstName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Nom</p>
                        <p className="text-base">{viewingSalesperson.lastName || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="text-base">{viewingSalesperson.email || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                        <p className="text-base">{viewingSalesperson.telephone || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                        <p className="text-base">{viewingSalesperson.adresse || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Date d'embauche</p>
                        <p className="text-base">{viewingSalesperson.dateEmbauche ? new Date(viewingSalesperson.dateEmbauche).toLocaleDateString('fr-FR') : '—'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Informations complémentaires */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Informations complémentaires</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code vendeur</p>
                        <p className="text-base">{viewingSalesperson.code || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Statut</p>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          viewingSalesperson.statut === 'actif'
                            ? 'bg-green-100 text-green-800'
                            : viewingSalesperson.statut === 'suspendu'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {viewingSalesperson.statut}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Code BC</p>
                        {viewingSalesperson.bcCode ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                            {viewingSalesperson.bcCode}
                          </span>
                        ) : (
                          <p className="text-base">—</p>
                        )}
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="connexion" className="mt-4 space-y-4">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Connexion Selos Retails</h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Login</p>
                        <p className="text-base">{viewingSalesperson.login || '—'}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Mot de passe</p>
                        <p className="text-base text-muted-foreground">••••••••</p>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="logistique" className="mt-4 space-y-6">
                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Secteur</h3>
                    {viewingSalesperson.secteur ? (
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Secteur assigné</p>
                        <p className="text-base font-medium mt-1">{viewingSalesperson.secteur.nom}</p>
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">Aucun secteur assigné à ce vendeur.</p>
                    )}
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Magasin assigné</h3>
                    {viewingSalesperson.bcLocation ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                          <p className="text-sm font-medium text-muted-foreground">Nom du magasin</p>
                          <div className="mt-1 flex items-center space-x-2">
                            <Badge variant="secondary" className="text-base">
                              <Store className="mr-2 h-4 w-4" />
                              {viewingSalesperson.bcLocation.displayName || 'N/A'}
                            </Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Code Magasin</p>
                          <p className="text-base">{viewingSalesperson.bcLocation.code || '—'}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">ID Business Central</p>
                          <p className="text-base">{viewingSalesperson.bcLocation.bcId || '—'}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">Aucun magasin assigné à ce vendeur.</p>
                    )}
                  </div>

                  <div className="space-y-4 border-b pb-4">
                    <h3 className="text-lg font-semibold">Canaux</h3>
                    {viewingSalesperson.salespersonCanals && viewingSalesperson.salespersonCanals.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingSalesperson.salespersonCanals.map((sc) => (
                          <Badge key={sc.canal.id} variant="outline" className="text-sm">
                            {sc.canal.nom}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">Aucun canal assigné à ce vendeur.</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Types de vente</h3>
                    {viewingSalesperson.salespersonTypeVentes && viewingSalesperson.salespersonTypeVentes.length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {viewingSalesperson.salespersonTypeVentes.map((stv) => (
                          <Badge key={stv.typeVente.id} variant="outline" className="text-sm">
                            {stv.typeVente.nom}
                          </Badge>
                        ))}
                      </div>
                    ) : (
                      <p className="text-base text-muted-foreground">Aucun type de vente assigné à ce vendeur.</p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted-foreground">Aucun vendeur sélectionné</p>
              </div>
            )}
          </div>
          <DrawerFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => { setIsViewOpen(false); setViewingId(null); }}>
              <XCircle className="mr-2 h-4 w-4" />
              Fermer
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Drawer Calendrier de Visite */}
      <CalendrierVisiteDrawer 
        secteur={viewingSecteur}
        isOpen={calendrierVisiteOpen}
        onClose={() => {
          setCalendrierVisiteOpen(false);
          setViewingSecteur(null);
        }}
      />
    </div>
  );
}

// Component for Calendrier de Visite Drawer
function CalendrierVisiteDrawer({ 
  secteur, 
  isOpen, 
  onClose 
}: { 
  secteur: Secteur | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const { data: circuitCommercial, isLoading } = useCircuitCommercial(secteur?.id ?? null);
  const { data: zones = [] } = useZones();

  const jours = [
    { id: 1, nom: 'Lundi' },
    { id: 2, nom: 'Mardi' },
    { id: 3, nom: 'Mercredi' },
    { id: 4, nom: 'Jeudi' },
    { id: 5, nom: 'Vendredi' },
    { id: 6, nom: 'Samedi' },
    { id: 7, nom: 'Dimanche' },
  ];

  // Générer les numéros de semaine (1 à 52)
  const semaines = Array.from({ length: 52 }, (_, i) => i + 1);

  // Fonction pour calculer la semaine du mois pour une semaine donnée de l'année
  const getSemaineDuMois = (semaineAnnee: number): number => {
    // Approche simplifiée : chaque mois a environ 4.33 semaines
    // On divise l'année en 12 mois, chaque mois ayant ~4 semaines
    // Semaine 1-4 = mois 1 (semaine 1-4 du mois)
    // Semaine 5-8 = mois 2 (semaine 1-4 du mois)
    // etc.
    const semaineDansMois = ((semaineAnnee - 1) % 4) + 1;
    return semaineDansMois;
  };

  // Fonction pour calculer si une zone doit être affichée pour une semaine et un jour donnés
  const shouldDisplayZone = (
    zoneData: { jour: number; frequence: 'semaine' | 'quinzaine' | 'mois'; groupes?: string | null },
    semaine: number,
    jour: number
  ): boolean => {
    // Vérifier que le jour correspond
    if (zoneData.jour !== jour) {
      return false;
    }

    switch (zoneData.frequence) {
      case 'semaine':
        // Par semaine : afficher toutes les semaines
        return true;

      case 'quinzaine':
        // Par quinzaine : vérifier les groupes
        if (!zoneData.groupes) return false;
        const groupes = zoneData.groupes.split(',').map(g => parseInt(g.trim()));
        
        if (groupes.includes(1) && groupes.includes(3)) {
          // Groupes 1,3 : semaines impaires (1, 3, 5, 7, 9, 11, 13, 15, 17, 19, 21, 23, 25, 27, 29, 31, 33, 35, 37, 39, 41, 43, 45, 47, 49, 51)
          return semaine % 2 === 1;
        } else if (groupes.includes(2) && groupes.includes(4)) {
          // Groupes 2,4 : semaines paires (2, 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30, 32, 34, 36, 38, 40, 42, 44, 46, 48, 50, 52)
          return semaine % 2 === 0;
        }
        return false;

      case 'mois':
        // Par mois : calculer la semaine du mois
        if (!zoneData.groupes) return false;
        const groupeMois = parseInt(zoneData.groupes.trim());
        
        // Calculer la semaine du mois pour cette semaine de l'année
        const semaineDansMois = getSemaineDuMois(semaine);
        
        return semaineDansMois === groupeMois;

      default:
        return false;
    }
  };

  // Obtenir les zones pour une cellule donnée (semaine, jour)
  const getZonesForCell = (semaine: number, jour: number) => {
    if (!circuitCommercial?.circuitCommercialZones) return [];
    
    return circuitCommercial.circuitCommercialZones
      .filter(cz => shouldDisplayZone(cz, semaine, jour))
      .map(cz => {
        const zone = zones.find(z => z.id === cz.zoneId);
        return {
          ...cz,
          zoneNom: zone?.nom || 'Zone inconnue',
          zoneClientCount: zone?.clientCount ?? 0,
        };
      });
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent 
        side="right" 
        className="h-full flex flex-col"
        style={{ width: '98vw', maxWidth: '98vw' }}
      >
        <DrawerHeader>
          <DrawerTitle>Calendrier de Visite - {secteur?.nom}</DrawerTitle>
        </DrawerHeader>
        <div className="flex-1 overflow-auto px-6 py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin"/>
              <span className="ml-2">Chargement...</span>
            </div>
          ) : !circuitCommercial?.circuitCommercialZones || circuitCommercial.circuitCommercialZones.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              Aucun circuit commercial configuré. Veuillez configurer le circuit commercial d'abord.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm text-gray-600 mb-4">
                <p>Légende : Les zones sont affichées dans les cellules correspondant à leur jour et fréquence de visite.</p>
              </div>
              
              {/* Tableau du calendrier */}
              <div className="border rounded-lg overflow-hidden bg-white dark:bg-gray-950">
                <div className="overflow-x-auto max-h-[calc(100vh-300px)]">
                  <table className="w-full border-collapse">
                    <thead className="sticky top-0 z-20">
                      <tr className="bg-gray-100 dark:bg-gray-800">
                        <th className="border p-2 text-left font-semibold sticky left-0 bg-gray-100 dark:bg-gray-800 z-30 min-w-[120px] shadow-lg">
                          Jour / Semaine
                        </th>
                        {semaines.map((semaine) => (
                          <th 
                            key={semaine} 
                            className="border p-2 text-center font-semibold min-w-[80px] bg-gray-100 dark:bg-gray-800"
                          >
                            S{semaine}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {jours.map((jour) => (
                        <tr key={jour.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                          <td className="border p-2 font-medium sticky left-0 bg-white dark:bg-gray-950 z-20 shadow-lg">
                            {jour.nom}
                          </td>
                          {semaines.map((semaine) => {
                            const zonesForCell = getZonesForCell(semaine, jour.id);
                            return (
                              <td 
                                key={`${jour.id}-${semaine}`} 
                                className="border p-1 text-xs align-top min-h-[60px] w-[80px]"
                              >
                                {zonesForCell.length > 0 ? (
                                  <div className="space-y-1">
                                    {zonesForCell.map((cz) => (
                                      <div
                                        key={cz.id}
                                        className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded px-1 py-0.5 font-medium text-[10px] truncate cursor-help"
                                        title={`${cz.zoneNom} (${cz.zoneClientCount} client${cz.zoneClientCount > 1 ? 's' : ''}) - ${cz.frequence}${cz.groupes ? ` (${cz.groupes})` : ''}`}
                                      >
                                        {cz.zoneNom} <span className="font-semibold">({cz.zoneClientCount})</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="text-gray-300 dark:text-gray-700 text-center text-[10px]">—</div>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Légende des fréquences */}
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <h3 className="font-semibold mb-2">Légende des fréquences :</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Par semaine :</span> Zone visitée chaque semaine
                  </div>
                  <div>
                    <span className="font-medium">Par quinzaine (1,3) :</span> Zone visitée les semaines impaires
                  </div>
                  <div>
                    <span className="font-medium">Par quinzaine (2,4) :</span> Zone visitée les semaines paires
                  </div>
                  <div>
                    <span className="font-medium">Par mois (1-4) :</span> Zone visitée la semaine correspondante du mois
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        <DrawerFooter className="border-t pt-4">
          <Button variant="outline" onClick={onClose}>
            <XCircle className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}

