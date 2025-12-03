import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { QueryUserDto } from './dto/query-user.dto';
import { LogsService } from '../logs/logs.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async create(createUserDto: CreateUserDto, userId: string) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    // Création normale de l'utilisateur
    const user = await this.prisma.user.create({
      data: {
        ...createUserDto,
        password: hashedPassword,
      },
      include: { role: true, typeUser: true, secteur: true, region: true, canal: true, typeVente: true, bcLocation: true },
    });

    // Log the creation
    this.logsService.emitLog({
      userId,
      module: 'users',
      action: 'create',
      recordId: user.id,
      description: `Utilisateur ${user.firstName} ${user.lastName} créé`,
      newData: { ...user, password: '[HIDDEN]' },
    });

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async findAll(query: QueryUserDto) {
    const { page = 1, limit = 10, search, sortBy = 'createdAt', sortOrder = 'desc' } = query;
    const skip = (page - 1) * limit;

    const where = search
      ? {
          OR: [
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],
        }
      : {};

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: { role: true, typeUser: true, secteur: true, region: true, canal: true, typeVente: true, bcLocation: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    // Remove passwords from response
    const usersWithoutPasswords = users.map(({ password, ...user }) => user);

    return {
      data: usersWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true, typeUser: true, secteur: true, region: true, canal: true, typeVente: true, bcLocation: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async update(id: string, updateUserDto: UpdateUserDto, userId: string) {
    const existingUser = await this.findOne(id);
    
    // Check if email already exists (if email is being updated)
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new ConflictException('Email already exists');
      }
    }

    // Validate required fields for salesperson type
    const typeUserId = updateUserDto.typeUserId !== undefined ? updateUserDto.typeUserId : existingUser.typeUserId;
    if (typeUserId && typeof typeUserId === 'number') {
      try {
        const typeUser = await this.prisma.typeUser.findUnique({
          where: { id: typeUserId },
        });

        if (typeUser && typeUser.nom.toLowerCase() === 'salesperson') {
          const secteurId = updateUserDto.secteurId !== undefined ? updateUserDto.secteurId : (existingUser.secteurId ?? null);
          const canalId = updateUserDto.canalId !== undefined ? updateUserDto.canalId : (existingUser.canalId ?? null);
          const typeVenteId = updateUserDto.typeVenteId !== undefined ? updateUserDto.typeVenteId : (existingUser.typeVenteId ?? null);

          if (!secteurId) {
            throw new BadRequestException('Le secteur est obligatoire pour le type utilisateur "salesperson"');
          }
          if (!canalId) {
            throw new BadRequestException('Le canal est obligatoire pour le type utilisateur "salesperson"');
          }
          if (!typeVenteId) {
            throw new BadRequestException('Le type de vente est obligatoire pour le type utilisateur "salesperson"');
          }
        }
      } catch (error) {
        // If typeUser not found, skip validation
        if (error instanceof BadRequestException) {
          throw error;
        }
      }
    }

    // Build update data object, only including defined fields
    // For nullable fields, we include them if they are explicitly set (even if null)
    const updateData: any = {};
    
    if (updateUserDto.firstName !== undefined) updateData.firstName = updateUserDto.firstName;
    if (updateUserDto.lastName !== undefined) updateData.lastName = updateUserDto.lastName;
    if (updateUserDto.email !== undefined) updateData.email = updateUserDto.email;
    if (updateUserDto.roleId !== undefined) updateData.roleId = updateUserDto.roleId;
    if (updateUserDto.isActive !== undefined) updateData.isActive = updateUserDto.isActive;
    if (updateUserDto.typeUserId !== undefined) updateData.typeUserId = updateUserDto.typeUserId;
    if (updateUserDto.secteurId !== undefined) updateData.secteurId = updateUserDto.secteurId;
    if (updateUserDto.regionId !== undefined) updateData.regionId = updateUserDto.regionId;
    if (updateUserDto.canalId !== undefined) updateData.canalId = updateUserDto.canalId;
    if (updateUserDto.typeVenteId !== undefined) updateData.typeVenteId = updateUserDto.typeVenteId;
    // Allow null to be explicitly set for bcLocationId (to remove the location)
    if (updateUserDto.bcLocationId !== undefined) {
      updateData.bcLocationId = updateUserDto.bcLocationId === null ? null : updateUserDto.bcLocationId;
    }
    
    if (updateUserDto.password) {
      updateData.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: updateData,
        include: { role: true, typeUser: true, secteur: true, region: true, canal: true, typeVente: true, bcLocation: true },
      });

      // Log the update
      this.logsService.emitLog({
        userId,
        module: 'users',
        action: 'update',
        recordId: user.id,
        description: `Utilisateur ${user.firstName} ${user.lastName} modifié`,
        oldData: existingUser,
        newData: { ...user, password: '[HIDDEN]' },
      });

      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    } catch (error) {
      console.error('Error updating user:', error);
      console.error('Update data:', JSON.stringify(updateData, null, 2));
      console.error('User ID:', id);
      throw error;
    }
  }

  async remove(id: string, userId: string) {
    const existingUser = await this.findOne(id);
    
    await this.prisma.user.delete({
      where: { id },
    });

    // Log the deletion
    this.logsService.emitLog({
      userId,
      module: 'users',
      action: 'delete',
      recordId: id,
      description: `Utilisateur ${existingUser.firstName} ${existingUser.lastName} supprimé`,
      oldData: existingUser,
      newData: null,
    });

    return { message: 'User deleted successfully' };
  }

  async toggleActive(id: string, userId: string) {
    const user = await this.findOne(id);
    
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
      include: { role: true },
    });

    // Log the status change
    this.logsService.emitLog({
      userId,
      module: 'users',
      action: 'update',
      recordId: user.id,
      description: `Utilisateur ${user.firstName} ${user.lastName} ${updatedUser.isActive ? 'activé' : 'désactivé'}`,
      oldData: user,
      newData: { ...updatedUser, password: '[HIDDEN]' },
    });

    const { password, ...userWithoutPassword } = updatedUser;
    return userWithoutPassword;
  }
}


