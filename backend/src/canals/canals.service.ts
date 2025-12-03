import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCanalDto } from './dto/create-canal.dto';
import { UpdateCanalDto } from './dto/update-canal.dto';

@Injectable()
export class CanalsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCanalDto) {
    const exists = await this.prisma.canal.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Canal name already exists');
    return this.prisma.canal.create({ data: dto });
  }

  async findAll() {
    return this.prisma.canal.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const canal = await this.prisma.canal.findUnique({ where: { id } });
    if (!canal) throw new NotFoundException('Canal not found');
    return canal;
  }

  async update(id: number, dto: UpdateCanalDto) {
    await this.findOne(id);
    return this.prisma.canal.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.canal.delete({ where: { id } });
    return { message: 'Canal deleted successfully' };
  }
}


