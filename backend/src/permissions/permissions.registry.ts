export interface PermissionModule {
  key: string; // machine key
  label: string; // display name
  capabilities: Array<'read' | 'write' | 'delete'>;
}

// Central registry: add modules here to expose their permissions
export const PERMISSION_MODULES: PermissionModule[] = [
  { key: 'users', label: 'Utilisateurs', capabilities: ['read', 'write', 'delete'] },
  { key: 'clients', label: 'Clients', capabilities: ['read', 'write', 'delete'] },
  { key: 'client', label: 'Clients Business Central', capabilities: ['read', 'write'] },
  { key: 'location', label: 'Magasins Business Central', capabilities: ['read', 'write'] },
  { key: 'roles', label: 'Rôles', capabilities: ['read', 'write', 'delete'] },
  { key: 'logs', label: 'Logs', capabilities: ['read'] },
  { key: 'type-users', label: 'Types utilisateur', capabilities: ['read', 'write', 'delete'] },
  { key: 'secteur', label: 'Secteurs', capabilities: ['read', 'write', 'delete'] },
  { key: 'canal', label: 'Canaux', capabilities: ['read', 'write', 'delete'] },
  { key: 'type-vente', label: 'Types de vente', capabilities: ['read', 'write', 'delete'] },
  { key: 'zone', label: 'Zones', capabilities: ['read', 'write', 'delete'] },
  { key: 'region', label: 'Régions', capabilities: ['read', 'write', 'delete'] },
  { key: 'sous-region', label: 'Sous-régions', capabilities: ['read', 'write', 'delete'] },
  { key: 'gouvernorat', label: 'Gouvernorats', capabilities: ['read', 'write', 'delete'] },
  { key: 'delegation', label: 'Délégations', capabilities: ['read', 'write', 'delete'] },
  { key: 'localite', label: 'Localités', capabilities: ['read', 'write', 'delete'] },
  { key: 'type-client', label: 'Types client', capabilities: ['read', 'write', 'delete'] },
  // Module Logistique
  { key: 'salesperson', label: 'Vendeurs', capabilities: ['read', 'write', 'delete'] },
  { key: 'chargement-type', label: 'Types de chargement', capabilities: ['read', 'write', 'delete'] },
  { key: 'purchase-order', label: 'Bons de commande', capabilities: ['read', 'write', 'delete'] },
  { key: 'delivery-note', label: 'Bons de livraison', capabilities: ['read', 'write', 'delete'] },
  { key: 'sale', label: 'Ventes', capabilities: ['read', 'write', 'delete'] },
  { key: 'purchase-invoice', label: 'Factures d\'achat', capabilities: ['read', 'write', 'delete'] },
  { key: 'return-invoice', label: 'Factures de retour', capabilities: ['read', 'write', 'delete'] },
  { key: 'stock', label: 'Consultation du stock', capabilities: ['read'] },
];

export function toPermissionString(key: string, cap: 'read' | 'write' | 'delete') {
  // normalize key to colon namespace without spaces
  const normalized = key.replace(/\s+/g, '-');
  return `${normalized}:${cap}`;
}

export function getPermissionCatalog() {
  return PERMISSION_MODULES.map(m => ({
    key: m.key,
    label: m.label,
    permissions: m.capabilities.map(cap => toPermissionString(m.key, cap)),
  }));
}
