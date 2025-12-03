import {
  LayoutDashboard,
  Users,
  UserCheck,
  Shield,
  FileText,
  MapPin,
  Building2,
  UserCog,
  Globe,
  Layers,
  Building,
  Home,
  Map,
  Briefcase,
  Grid3x3,
  ShoppingCart,
  Radio,
  UserCircle,
  Tags,
  Database,
  Package,
  Store,
  PackageSearch,
  ShoppingBag,
  FileCheck,
  TestTube,
  Truck,
  RotateCcw,
  Receipt,
  Calculator,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: any;
  requiredPermissions?: string[];
};

export type NavSubGroup = {
  title: string;
  icon?: any;
  items: NavItem[];
};

export type NavGroup = {
  title: string;
  icon?: any;
  items?: NavItem[];
  subGroups?: NavSubGroup[];
};

export const navigationGroups: NavGroup[] = [
  {
    title: 'Général',
    icon: LayoutDashboard,
    items: [
      { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'Géographie',
    icon: MapPin,
    items: [
      { name: 'Régions', href: '/regions', icon: Globe, requiredPermissions: ['region:read'] },
      { name: 'Sous-régions', href: '/sous-regions', icon: Layers, requiredPermissions: ['sous-region:read'] },
      { name: 'Gouvernorats', href: '/gouvernorats', icon: Building, requiredPermissions: ['gouvernorat:read'] },
      { name: 'Délégations', href: '/delegations', icon: Home, requiredPermissions: ['delegation:read'] },
      { name: 'Localités', href: '/localites', icon: Map, requiredPermissions: ['localite:read'] },
    ],
  },
  {
    title: 'Commercial',
    icon: Building2,
    items: [
      { name: 'Secteurs', href: '/secteurs', icon: Briefcase, requiredPermissions: ['secteur:read'] },
      { name: 'Zones', href: '/zones', icon: Grid3x3, requiredPermissions: ['zone:read'] },
      { name: 'Types de vente', href: '/type-ventes', icon: ShoppingCart, requiredPermissions: ['type-vente:read'] },
      { name: 'Canaux', href: '/canaux', icon: Radio, requiredPermissions: ['canal:read'] },
    ],
  },
  {
    title: 'Gestion',
    icon: Users,
    items: [
      { name: 'Clients', href: '/clients', icon: UserCircle, requiredPermissions: ['clients:read'] },
      { name: 'Types client', href: '/type-clients', icon: Tags, requiredPermissions: ['type-client:read'] },
      { name: 'Clients BC', href: '/customers', icon: Database, requiredPermissions: ['client:read'] },
      { name: 'Articles BC', href: '/items', icon: Package, requiredPermissions: ['client:read'] },
      { name: 'Magasins BC', href: '/locations', icon: Store, requiredPermissions: ['location:read'] },
    ],
  },
  {
    title: 'Utilisateurs',
    icon: UserCheck,
    items: [
      { name: 'Utilisateurs', href: '/users', icon: UserCheck, requiredPermissions: ['users:read'] },
      { name: 'Types utilisateur', href: '/type-users', icon: Tags, requiredPermissions: ['type-users:read'] },
    ],
  },
  {
    title: 'Logistique',
    icon: Store,
    items: [
      { name: 'Vendeurs', href: '/salespersons', icon: UserCircle, requiredPermissions: ['salesperson:read'] },
      { name: 'Types de chargement', href: '/chargement-types', icon: PackageSearch, requiredPermissions: ['chargement-type:read'] },
      { name: 'Bons de commande', href: '/purchase-orders', icon: ShoppingBag, requiredPermissions: ['purchase-order:read'] },
      { name: 'Bons de livraison', href: '/delivery-notes', icon: Truck, requiredPermissions: ['delivery-note:read'] },
      { name: 'Facture Vente', href: '/sales', icon: Receipt, requiredPermissions: ['sale:read'] },
      { name: 'Factures d\'achat', href: '/purchase-invoices', icon: FileCheck, requiredPermissions: ['purchase-invoice:read'] },
      { name: 'Factures de retour', href: '/return-invoices', icon: RotateCcw, requiredPermissions: ['return-invoice:read'] },
      { name: 'Consultation du stock', href: '/stock', icon: Package, requiredPermissions: ['stock:read'] },
    ],
  },
  {
    title: 'Consultation et calcul des prix de vente',
    icon: Calculator,
    items: [
      { name: 'Stock par magasin', href: '/stock-by-location', icon: Store, requiredPermissions: ['stock:read'] },
    ],
  },
  {
    title: 'Test & debug',
    icon: TestTube,
    items: [
      { name: 'Prix de vente', href: '/test/prix-vente', icon: Tags, requiredPermissions: ['client:read'] },
    ],
  },
  {
    title: 'Paramètres',
    icon: UserCog,
    items: [
      { name: 'Rôles', href: '/roles', icon: Shield, requiredPermissions: ['roles:read'] },
      { name: 'Logs', href: '/logs', icon: FileText, requiredPermissions: ['logs:read'] },
    ],
  },
];

// Flattened navigation for backward compatibility (used in search)
export const navigation: NavItem[] = navigationGroups.flatMap(group => [
  ...(group.items || []),
  ...(group.subGroups?.flatMap(subGroup => subGroup.items) || []),
]);

export function getVisibleNavigation(userPermissions: string[]): NavItem[] {
  return navigation.filter((item) => {
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
    return item.requiredPermissions.some((p) => userPermissions.includes(p));
  });
}

export function getVisibleNavigationGroups(userPermissions: string[]): NavGroup[] {
  return navigationGroups
    .map(group => {
      const visibleItems = (group.items || []).filter((item) => {
        if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
        return item.requiredPermissions.some((p) => userPermissions.includes(p));
      });

      const visibleSubGroups = (group.subGroups || [])
        .map(subGroup => ({
          ...subGroup,
          items: subGroup.items.filter((item) => {
            if (!item.requiredPermissions || item.requiredPermissions.length === 0) return true;
            return item.requiredPermissions.some((p) => userPermissions.includes(p));
          }),
        }))
        .filter(subGroup => subGroup.items.length > 0);

      return {
        ...group,
        items: visibleItems.length > 0 ? visibleItems : undefined,
        subGroups: visibleSubGroups.length > 0 ? visibleSubGroups : undefined,
      };
    })
    .filter(group => (group.items && group.items.length > 0) || (group.subGroups && group.subGroups.length > 0));
}

export function searchModules(query: string, userPermissions: string[]): NavItem[] {
  const visibleNav = getVisibleNavigation(userPermissions);
  const lowerQuery = query.trim().toLowerCase();
  if (!lowerQuery) return [];
  
  return visibleNav.filter((item) =>
    item.name.toLowerCase().includes(lowerQuery)
  );
}

