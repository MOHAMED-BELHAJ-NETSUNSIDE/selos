import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeUserDto } from './dto/create-type-user.dto';
import { UpdateTypeUserDto } from './dto/update-type-user.dto';

@Injectable()
export class TypeUsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.typeUser.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const tu = await this.prisma.typeUser.findUnique({ where: { id } });
    if (!tu) throw new NotFoundException('Type user not found');
    return tu;
  }

  async create(dto: CreateTypeUserDto) {
    return this.prisma.typeUser.create({ data: dto });
  }

  async update(id: number, dto: UpdateTypeUserDto) {
    await this.findOne(id);
    return this.prisma.typeUser.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.typeUser.delete({ where: { id } });
    return { message: 'Type user deleted successfully' };
  }
}
