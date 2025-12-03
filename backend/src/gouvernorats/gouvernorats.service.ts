import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGouvernoratDto } from './dto/create-gouvernorat.dto';
import { UpdateGouvernoratDto } from './dto/update-gouvernorat.dto';

@Injectable()
export class GouvernoratsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateGouvernoratDto) {
    const exists = await this.prisma.gouvernorat.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Gouvernorat name already exists');
    return this.prisma.gouvernorat.create({ data: dto });
  }

  async findAll() {
    return this.prisma.gouvernorat.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const item = await this.prisma.gouvernorat.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Gouvernorat not found');
    return item;
  }

  async update(id: number, dto: UpdateGouvernoratDto) {
    await this.findOne(id);
    return this.prisma.gouvernorat.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.gouvernorat.delete({ where: { id } });
    return { message: 'Gouvernorat deleted successfully' };
  }
}


