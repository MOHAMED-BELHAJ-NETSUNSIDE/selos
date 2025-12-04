import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    // Les utilisateurs avec le rôle Admin ont automatiquement tous les accès
    if (user.role?.name === 'Admin') {
      return true;
    }

    // Récupérer les permissions depuis user.role.permissions ou user.permissions
    let userPermissions: string[] = [];
    if (user.role?.permissions) {
      // Si permissions est un tableau, l'utiliser directement
      if (Array.isArray(user.role.permissions)) {
        userPermissions = user.role.permissions;
      } else if (typeof user.role.permissions === 'string') {
        // Si c'est une chaîne JSON, la parser
        try {
          userPermissions = JSON.parse(user.role.permissions);
        } catch {
          // Si ce n'est pas du JSON, traiter comme une liste séparée par des virgules
          userPermissions = user.role.permissions.split(',').map((p: string) => p.trim()).filter(Boolean);
        }
      }
    } else if (user.permissions && Array.isArray(user.permissions)) {
      // Fallback: vérifier user.permissions directement (pour les salespersons)
      userPermissions = user.permissions;
    }

    if (userPermissions.length === 0) {
      throw new ForbiddenException('User permissions not found');
    }

    const hasPermission = requiredPermissions.some(permission => {
      // Vérifier la permission exacte
      if (userPermissions.includes(permission)) {
        return true;
      }
      // Gérer les cas où 'client:read' est requis mais 'clients:read' est disponible
      if (permission === 'client:read' && userPermissions.includes('clients:read')) {
        return true;
      }
      // Gérer les cas où 'clients:read' est requis mais 'client:read' est disponible
      if (permission === 'clients:read' && userPermissions.includes('client:read')) {
        return true;
      }
      // Permettre l'accès en lecture aux salespersons si l'utilisateur a accès aux purchase-orders
      // (nécessaire pour créer des bons de commande)
      if (permission === 'salesperson:read' && (
        userPermissions.includes('purchase-order:read') || 
        userPermissions.includes('purchase-order:write')
      )) {
        return true;
      }
      // Permettre l'accès en lecture aux chargement-types si l'utilisateur a accès aux purchase-orders
      // (nécessaire pour créer des bons de commande)
      if (permission === 'chargement-type:read' && (
        userPermissions.includes('purchase-order:read') || 
        userPermissions.includes('purchase-order:write')
      )) {
        return true;
      }
      // Permettre l'accès en lecture aux locations (magasins) si l'utilisateur a accès aux purchase-orders
      // (nécessaire pour créer des bons de commande)
      if (permission === 'location:read' && (
        userPermissions.includes('purchase-order:read') || 
        userPermissions.includes('purchase-order:write')
      )) {
        return true;
      }
      // Permettre l'accès en lecture aux articles BC si l'utilisateur a accès au stock
      // (nécessaire pour consulter le stock par article et magasin)
      if (permission === 'client:read' && userPermissions.includes('stock:read')) {
        return true;
      }
      return false;
    });

    if (!hasPermission) {
      throw new ForbiddenException('Insufficient permissions');
    }

    return true;
  }
}




