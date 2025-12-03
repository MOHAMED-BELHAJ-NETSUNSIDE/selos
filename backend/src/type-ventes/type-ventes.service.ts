import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeVenteDto } from './dto/create-type-vente.dto';
import { UpdateTypeVenteDto } from './dto/update-type-vente.dto';

@Injectable()
export class TypeVentesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateTypeVenteDto) {
    const exists = await this.prisma.typeVente.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Type vente name already exists');
    return this.prisma.typeVente.create({ data: dto });
  }

  async findAll() {
    return this.prisma.typeVente.findMany({ orderBy: { id: 'asc' } });
  }

  async findOne(id: number) {
    const tv = await this.prisma.typeVente.findUnique({ where: { id } });
    if (!tv) throw new NotFoundException('Type vente not found');
    return tv;
  }

  async update(id: number, dto: UpdateTypeVenteDto) {
    await this.findOne(id);
    return this.prisma.typeVente.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.typeVente.delete({ where: { id } });
    return { message: 'Type vente deleted successfully' };
  }
}


