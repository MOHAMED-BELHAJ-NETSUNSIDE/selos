import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTypeClientDto } from './dto/create-type-client.dto';
import { UpdateTypeClientDto } from './dto/update-type-client.dto';

@Injectable()
export class TypeClientsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.typeClient.findMany({
      orderBy: { id: 'asc' },
    });
  }

  async findOne(id: number) {
    const tc = await this.prisma.typeClient.findUnique({ where: { id } });
    if (!tc) throw new NotFoundException('Type client not found');
    return tc;
  }

  async create(dto: CreateTypeClientDto) {
    return this.prisma.typeClient.create({ data: dto });
  }

  async update(id: number, dto: UpdateTypeClientDto) {
    await this.findOne(id);
    return this.prisma.typeClient.update({ where: { id }, data: dto });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.typeClient.delete({ where: { id } });
    return { message: 'Type client deleted successfully' };
  }
}


