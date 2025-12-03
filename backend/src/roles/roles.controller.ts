import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RolesService } from './roles.service';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRoleDto } from './dto/update-role.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Roles')
@Controller('roles')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class RolesController {
  constructor(
    private readonly rolesService: RolesService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @Permissions('roles:write')
  @ApiOperation({ summary: 'Create a new role' })
  @ApiResponse({ status: 201, description: 'Role created successfully' })
  async create(@Body() createRoleDto: CreateRoleDto, @CurrentUser() user: any) {
    const role = await this.rolesService.create(createRoleDto, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'roles',
      action: 'create',
      recordId: role.id,
      description: `Rôle ${role.name} créé`,
      newData: role,
    });
    
    return role;
  }

  @Get()
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Get all roles' })
  @ApiResponse({ status: 200, description: 'Roles retrieved successfully' })
  findAll() {
    return this.rolesService.findAll();
  }

  @Get(':id')
  @Permissions('roles:read')
  @ApiOperation({ summary: 'Get a role by id' })
  @ApiResponse({ status: 200, description: 'Role retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  @Patch(':id')
  @Permissions('roles:write')
  @ApiOperation({ summary: 'Update a role' })
  @ApiResponse({ status: 200, description: 'Role updated successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async update(@Param('id') id: string, @Body() updateRoleDto: UpdateRoleDto, @CurrentUser() user: any) {
    const oldRole = await this.rolesService.findOne(id);
    const role = await this.rolesService.update(id, updateRoleDto, user.id);
    
    // Déterminer quels champs ont été modifiés
    const changedFields: string[] = [];
    if (updateRoleDto.name && updateRoleDto.name !== oldRole.name) {
      changedFields.push('name');
    }
    if (updateRoleDto.permissions && updateRoleDto.permissions !== oldRole.permissions) {
      changedFields.push('permissions');
    }
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'roles',
      action: 'update',
      recordId: role.id,
      description: `Champs modifiés: ${changedFields.join(', ')}`,
      oldData: oldRole,
      newData: role,
    });
    
    return role;
  }

  @Delete(':id')
  @Permissions('roles:delete')
  @ApiOperation({ summary: 'Delete a role' })
  @ApiResponse({ status: 200, description: 'Role deleted successfully' })
  @ApiResponse({ status: 404, description: 'Role not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const oldRole = await this.rolesService.findOne(id);
    await this.rolesService.remove(id, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'roles',
      action: 'delete',
      recordId: id,
      description: `Rôle ${oldRole.name} supprimé`,
      oldData: oldRole,
    });
    
    return { message: 'Rôle supprimé avec succès' };
  }
}
