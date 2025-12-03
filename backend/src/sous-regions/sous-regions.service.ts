import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSousRegionDto } from './dto/create-sous-region.dto';
import { UpdateSousRegionDto } from './dto/update-sous-region.dto';

@Injectable()
export class SousRegionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSousRegionDto) {
    const exists = await this.prisma.sousRegion.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Sous-région name already exists');
    return this.prisma.sousRegion.create({ data: dto });
  }

  async findAll() {
    return this.prisma.sousRegion.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const sr = await this.prisma.sousRegion.findUnique({ where: { id } });
    if (!sr) throw new NotFoundException('Sous-région not found');
    return sr;
  }

  async update(id: number, dto: UpdateSousRegionDto) {
    await this.findOne(id);
    return this.prisma.sousRegion.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.sousRegion.delete({ where: { id } });
    return { message: 'Sous-région deleted successfully' };
  }
}


