import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  UserCircle,
  Settings,
  Receipt,
  RotateCcw,
  Warehouse,
} from 'lucide-react';

export type NavItem = {
  name: string;
  href: string;
  icon: any;
};

export type NavGroup = {
  title: string;
  icon?: any;
  items: NavItem[];
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
    title: 'Ventes',
    icon: ShoppingCart,
    items: [
      { name: 'Clients', href: '/clients', icon: UserCircle },
      { name: 'Articles', href: '/articles', icon: Package },
      { name: 'Stock', href: '/stock', icon: Warehouse },
      { name: 'Factures d\'achat', href: '/purchase-invoices', icon: Receipt },
      { name: 'Factures de retour', href: '/return-invoices', icon: RotateCcw },
    ],
  },
  {
    title: 'Paramètres',
    icon: Settings,
    items: [
      { name: 'Profil', href: '/profile', icon: UserCircle },
    ],
  },
];

export const navigation: NavItem[] = navigationGroups.flatMap(group => group.items);

