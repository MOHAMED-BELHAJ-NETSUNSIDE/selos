import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { LogsService } from '../logs/logs.service';

@Injectable()
export class RolesService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async create(createRoleDto: CreateRoleDto, userId: string) {
    // Check if role name already exists
    const existingRole = await this.prisma.role.findUnique({
      where: { name: createRoleDto.name },
    });

    if (existingRole) {
      throw new ConflictException('Role name already exists');
    }

    const role = await this.prisma.role.create({
      data: {
        ...createRoleDto,
        permissions: JSON.stringify(createRoleDto.permissions),
      },
    });

    // Log the creation
    this.logsService.emitLog({
      userId,
      module: 'roles',
      action: 'create',
      recordId: role.id,
      description: `Rôle ${role.name} créé`,
      newData: { ...role, permissions: createRoleDto.permissions },
    });

    return {
      ...role,
      permissions: createRoleDto.permissions,
    };
  }

  async findAll() {
    const roles = await this.prisma.role.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return roles.map(role => {
      let perms: any = [];
      try {
        perms = JSON.parse(role.permissions);
      } catch {
        // fallback: comma separated
        perms = (role.permissions || '').split(',').map(p => p.trim()).filter(Boolean);
      }
      return { ...role, permissions: perms };
    });
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    let perms: any = [];
    try {
      perms = JSON.parse(role.permissions);
    } catch {
      perms = (role.permissions || '').split(',').map(p => p.trim()).filter(Boolean);
    }
    return { ...role, permissions: perms };
  }

  async update(id: string, updateRoleDto: UpdateRoleDto, userId: string) {
    const existingRole = await this.findOne(id);
    
    // Check if role name already exists (if name is being updated)
    if (updateRoleDto.name && updateRoleDto.name !== existingRole.name) {
      const nameExists = await this.prisma.role.findUnique({
        where: { name: updateRoleDto.name },
      });

      if (nameExists) {
        throw new ConflictException('Role name already exists');
      }
    }

    const updateData: any = { ...updateRoleDto };
    if (updateRoleDto.permissions) {
      updateData.permissions = JSON.stringify(updateRoleDto.permissions);
    }

    const role = await this.prisma.role.update({
      where: { id },
      data: updateData,
    });

    // Log the update
    this.logsService.emitLog({
      userId,
      module: 'roles',
      action: 'update',
      recordId: role.id,
      description: `Rôle ${role.name} modifié`,
      oldData: existingRole,
      newData: {
        ...role,
        permissions: updateRoleDto.permissions || ((): any => {
          try { return JSON.parse(existingRole.permissions as any); } catch { return (existingRole as any).permissions; }
        })(),
      },
    });

    let updatedPerms: any = updateRoleDto.permissions;
    if (!updatedPerms) {
      try { updatedPerms = JSON.parse(existingRole.permissions as any); } catch { updatedPerms = (existingRole as any).permissions; }
    }
    return { ...role, permissions: updatedPerms };
  }

  async remove(id: string, userId: string) {
    const existingRole = await this.findOne(id);
    
    // Check if role is being used by any user
    const usersWithRole = await this.prisma.user.findFirst({
      where: { roleId: id },
    });

    if (usersWithRole) {
      throw new ConflictException('Cannot delete role that is assigned to users');
    }

    await this.prisma.role.delete({
      where: { id },
    });

    // Log the deletion
    this.logsService.emitLog({
      userId,
      module: 'roles',
      action: 'delete',
      recordId: id,
      description: `Rôle ${existingRole.name} supprimé`,
      oldData: existingRole,
      newData: null,
    });

    return { message: 'Role deleted successfully' };
  }
}



