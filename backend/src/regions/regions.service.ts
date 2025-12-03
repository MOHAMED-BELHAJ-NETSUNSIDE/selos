import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRegionDto } from './dto/create-region.dto';
import { UpdateRegionDto } from './dto/update-region.dto';

@Injectable()
export class RegionsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateRegionDto) {
    const exists = await this.prisma.region.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Region name already exists');
    return this.prisma.region.create({ data: dto });
  }

  async findAll() {
    return this.prisma.region.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const region = await this.prisma.region.findUnique({ where: { id } });
    if (!region) throw new NotFoundException('Region not found');
    return region;
  }

  async update(id: number, dto: UpdateRegionDto) {
    await this.findOne(id);
    return this.prisma.region.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.region.delete({ where: { id } });
    return { message: 'Region deleted successfully' };
  }

  // Associations Region-SousRegion
  async listSousRegions(regionId: number) {
    await this.findOne(regionId);
    const links = await this.prisma.regionSousRegion.findMany({ where: { regionId }, include: { sousRegion: true } });
    return links.map((l) => l.sousRegion);
  }

  async addSousRegion(regionId: number, sousRegionId: number) {
    await this.findOne(regionId);
    const sousRegion = await this.prisma.sousRegion.findUnique({ where: { id: sousRegionId } });
    if (!sousRegion) throw new NotFoundException('Sous-region not found');
    return this.prisma.regionSousRegion.upsert({
      where: { regionId_sousRegionId: { regionId, sousRegionId } },
      update: {},
      create: { regionId, sousRegionId },
    });
  }

  async removeSousRegion(regionId: number, sousRegionId: number) {
    await this.findOne(regionId);
    await this.prisma.regionSousRegion.delete({ where: { regionId_sousRegionId: { regionId, sousRegionId } } });
    return { message: 'Sous-region detached from region' };
  }
}

