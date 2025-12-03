// Utility functions for managing permissions

export interface ModulePermissions {
  module: string;
  read: boolean;
  write: boolean;
  delete: boolean;
}

export interface PermissionGroup {
  [moduleName: string]: ModulePermissions;
}

// Available modules and their permissions
export const MODULE_PERMISSIONS = {
  users: {
    module: 'Utilisateurs',
    read: 'users:read',
    write: 'users:write',
    delete: 'users:delete',
  },
  clients: {
    module: 'Clients',
    read: 'clients:read',
    write: 'clients:write',
    delete: 'clients:delete',
  },
  roles: {
    module: 'Rôles',
    read: 'roles:read',
    write: 'roles:write',
    delete: 'roles:delete',
  },
  logs: {
    module: 'Logs',
    read: 'logs:read',
    write: null, // Logs are read-only
    delete: null, // Logs are read-only
  },
  // Module Logistique
  salesperson: {
    module: 'Vendeurs',
    read: 'salesperson:read',
    write: 'salesperson:write',
    delete: 'salesperson:delete',
  },
  'chargement-type': {
    module: 'Types de chargement',
    read: 'chargement-type:read',
    write: 'chargement-type:write',
    delete: 'chargement-type:delete',
  },
  'purchase-order': {
    module: 'Bons de commande',
    read: 'purchase-order:read',
    write: 'purchase-order:write',
    delete: 'purchase-order:delete',
  },
  sale: {
    module: 'Ventes',
    read: 'sale:read',
    write: 'sale:write',
    delete: 'sale:delete',
  },
  'purchase-invoice': {
    module: 'Factures d\'achat',
    read: 'purchase-invoice:read',
    write: 'purchase-invoice:write',
    delete: 'purchase-invoice:delete',
  },
  'return-invoice': {
    module: 'Factures de retour',
    read: 'return-invoice:read',
    write: 'return-invoice:write',
    delete: 'return-invoice:delete',
  },
  location: {
    module: 'Magasins Business Central',
    read: 'location:read',
    write: 'location:write',
    delete: null, // Locations are read/write only
  },
} as const;

// Convert array of permissions to grouped permissions by module
export function groupPermissionsByModule(permissions: string[]): PermissionGroup {
  const grouped: PermissionGroup = {};

  Object.entries(MODULE_PERMISSIONS).forEach(([moduleKey, moduleConfig]) => {
    grouped[moduleKey] = {
      module: moduleConfig.module,
      read: permissions.includes(moduleConfig.read),
      write: moduleConfig.write ? permissions.includes(moduleConfig.write) : false,
      delete: moduleConfig.delete ? permissions.includes(moduleConfig.delete) : false,
    };
  });

  return grouped;
}

// Convert grouped permissions back to array of permission strings
export function ungroupPermissions(groupedPermissions: PermissionGroup): string[] {
  const permissions: string[] = [];

  Object.entries(groupedPermissions).forEach(([moduleKey, modulePerms]) => {
    const moduleConfig = MODULE_PERMISSIONS[moduleKey as keyof typeof MODULE_PERMISSIONS];
    
    if (modulePerms.read && moduleConfig.read) {
      permissions.push(moduleConfig.read);
    }
    if (modulePerms.write && moduleConfig.write) {
      permissions.push(moduleConfig.write);
    }
    if (modulePerms.delete && moduleConfig.delete) {
      permissions.push(moduleConfig.delete);
    }
  });

  return permissions;
}

// Get all available permissions as a flat array
export function getAllAvailablePermissions(): string[] {
  return Object.values(MODULE_PERMISSIONS)
    .flatMap(module => Object.values(module))
    .filter(permission => permission !== null) as string[];
}

// Get module names for display
export function getModuleNames(): string[] {
  return Object.values(MODULE_PERMISSIONS).map(module => module.module);
}



