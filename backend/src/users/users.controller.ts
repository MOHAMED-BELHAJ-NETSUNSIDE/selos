import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Post()
  @Permissions('users:write')
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async create(@Body() createUserDto: CreateUserDto, @CurrentUser() user: any) {
    const newUser = await this.usersService.create(createUserDto, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'users',
      action: 'create',
      recordId: newUser.id,
      description: `Utilisateur ${newUser.firstName} ${newUser.lastName} créé`,
      newData: { ...newUser, password: '[HIDDEN]' },
    });
    
    return newUser;
  }

  @Get()
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get all users with pagination and search' })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  findAll(@Query() query: QueryUserDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Permissions('users:read')
  @ApiOperation({ summary: 'Get a user by id' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @Permissions('users:write')
  @ApiOperation({ summary: 'Update a user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto, @CurrentUser() user: any) {
    const oldUser = await this.usersService.findOne(id);
    const updatedUser = await this.usersService.update(id, updateUserDto, user.id);
    
    // Déterminer quels champs ont été modifiés
    const changedFields: string[] = [];
    if (updateUserDto.firstName && updateUserDto.firstName !== oldUser.firstName) {
      changedFields.push('firstName');
    }
    if (updateUserDto.lastName && updateUserDto.lastName !== oldUser.lastName) {
      changedFields.push('lastName');
    }
    if (updateUserDto.email && updateUserDto.email !== oldUser.email) {
      changedFields.push('email');
    }
    if (updateUserDto.roleId && updateUserDto.roleId !== oldUser.roleId) {
      changedFields.push('roleId');
    }
    // Note: password n'est pas inclus dans UpdateUserDto
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'users',
      action: 'update',
      recordId: updatedUser.id,
      description: `Champs modifiés: ${changedFields.join(', ')}`,
      oldData: { ...oldUser, password: '[HIDDEN]' },
      newData: { ...updatedUser, password: '[HIDDEN]' },
    });
    
    return updatedUser;
  }

  @Patch(':id/toggle-active')
  @Permissions('users:write')
  @ApiOperation({ summary: 'Toggle user active status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    const oldUser = await this.usersService.findOne(id);
    const updatedUser = await this.usersService.toggleActive(id, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'users',
      action: 'update',
      recordId: updatedUser.id,
      description: `Champs modifiés: isActive`,
      oldData: { isActive: oldUser.isActive },
      newData: { isActive: updatedUser.isActive },
    });
    
    return updatedUser;
  }

  @Delete(':id')
  @Permissions('users:delete')
  @ApiOperation({ summary: 'Delete a user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id') id: string, @CurrentUser() user: any) {
    const oldUser = await this.usersService.findOne(id);
    await this.usersService.remove(id, user.id);
    
    // Émettre un événement de log
    this.eventEmitter.emit('log.created', {
      userId: user.id,
      module: 'users',
      action: 'delete',
      recordId: id,
      description: `Utilisateur ${oldUser.firstName} ${oldUser.lastName} supprimé`,
      oldData: { ...oldUser, password: '[HIDDEN]' },
    });
    
    return { message: 'Utilisateur supprimé avec succès' };
  }
}
