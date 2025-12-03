import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true, typeUser: true, bcLocation: true },
    });

    if (user && user.isActive && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const roleName = user.role?.name ?? 'NoRole';
    let rolePermissions: any = [];
    if (user.role?.permissions) {
      try {
        rolePermissions = JSON.parse(user.role.permissions);
      } catch {
        rolePermissions = user.role.permissions.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
    }
    const roleId = user.role?.id ?? '';

    const payload = { 
      email: user.email, 
      sub: user.id,
      role: roleName,
      permissions: rolePermissions,
      bcLocationId: user.bcLocationId || null,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: {
          id: roleId,
          name: roleName,
          permissions: rolePermissions,
        },
        typeUser: user.typeUser ? {
          id: user.typeUser.id,
          nom: user.typeUser.nom,
        } : null,
        bcLocationId: user.bcLocationId || null,
      },
    };
  }

  async validateToken(payload: any) {
    // Si c'est un salesperson (sub commence par "salesperson-")
    if (payload.sub?.startsWith('salesperson-')) {
      const salespersonId = payload.salespersonId || parseInt(payload.sub.replace('salesperson-', ''));
      const salesperson = await this.prisma.salesperson.findUnique({
        where: { id: salespersonId },
      });

      if (!salesperson || salesperson.statut !== 'actif') {
        throw new UnauthorizedException('Salesperson not found or inactive');
      }

      return {
        id: `salesperson-${salesperson.id}`,
        email: salesperson.email || salesperson.login,
        firstName: salesperson.firstName,
        lastName: salesperson.lastName,
        role: {
          id: 'salesperson-role',
          name: 'Salesperson',
          permissions: payload.permissions || [],
        },
        salesperson: {
          id: salesperson.id,
          login: salesperson.login,
          code: salesperson.code,
          firstName: salesperson.firstName,
          lastName: salesperson.lastName,
          depotName: salesperson.depotName,
        },
        salespersonId: salesperson.id,
      };
    }

    // Utilisateur normal
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { role: true },
    });

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const vRoleName = user.role?.name ?? 'NoRole';
    let vRolePermissions: any = [];
    if (user.role?.permissions) {
      try {
        vRolePermissions = JSON.parse(user.role.permissions);
      } catch {
        vRolePermissions = user.role.permissions.split(',').map((p: string) => p.trim()).filter(Boolean);
      }
    }
    const vRoleId = user.role?.id ?? '';

    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: vRoleId,
        name: vRoleName,
        permissions: vRolePermissions,
      },
      bcLocationId: user.bcLocationId || null,
    };
  }

  /**
   * Validation d'un Salesperson pour Selos Retails (avec login/password)
   */
  async validateSalesperson(login: string, password: string): Promise<any> {
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { login },
    });

    if (!salesperson) {
      return null;
    }

    // Vérifier que le vendeur est actif
    if (salesperson.statut !== 'actif') {
      return null;
    }

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, salesperson.password);
    if (!isPasswordValid) {
      return null;
    }

    const { password: _, ...salespersonWithoutPassword } = salesperson;
    return salespersonWithoutPassword;
  }

  /**
   * Login pour Selos Retails (avec login/password du Salesperson)
   */
  async loginSalesperson(login: string, password: string): Promise<AuthResponseDto> {
    const salesperson = await this.validateSalesperson(login, password);
    
    if (!salesperson) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Pour Selos Retails, les vendeurs ont un rôle par défaut "Salesperson"
    // avec des permissions spécifiques pour la vente
    const roleName = 'Salesperson';
    const rolePermissions = [
      'salesperson:read',
      'salesperson:write',
      'chargement-type:read',
      'chargement-type:write',
      'purchase-order:read',
      'purchase-order:write',
      'delivery-note:read',
      'delivery-note:write',
      'sale:read',
      'sale:write',
      'purchase-invoice:read',
      'purchase-invoice:write',
      'stock:read', // Permission pour consulter le stock
      'clients:read', // Permission pour consulter les clients (nécessaire pour créer des BL)
      'client:read', // Permission pour consulter les clients BC et les prix (nécessaire pour voir les conditions de prix)
    ];

    const payload = { 
      email: salesperson.email || salesperson.login, 
      sub: `salesperson-${salesperson.id}`,
      role: roleName,
      permissions: rolePermissions,
      salespersonId: salesperson.id,
      login: salesperson.login,
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: `salesperson-${salesperson.id}`,
        email: salesperson.email || salesperson.login,
        firstName: salesperson.firstName,
        lastName: salesperson.lastName,
        role: {
          id: 'salesperson-role',
          name: roleName,
          permissions: rolePermissions,
        },
        typeUser: {
          id: 0,
          nom: 'Salesperson',
        },
        salesperson: {
          id: salesperson.id,
          login: salesperson.login,
          code: salesperson.code,
          firstName: salesperson.firstName,
          lastName: salesperson.lastName,
          depotName: salesperson.depotName,
        },
      },
    };
  }
}


