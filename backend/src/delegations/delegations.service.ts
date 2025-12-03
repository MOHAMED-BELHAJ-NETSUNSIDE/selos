import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDelegationDto } from './dto/create-delegation.dto';
import { UpdateDelegationDto } from './dto/update-delegation.dto';

@Injectable()
export class DelegationsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const delegations = await this.prisma.delegation.findMany({ 
      orderBy: { id: 'asc' },
      include: {
        gouvernorat: true
      }
    });
    // Transformer idGouvernorat en id_gouvernorat pour le frontend
    return delegations.map(d => ({
      ...d,
      id_gouvernorat: d.idGouvernorat
    }));
  }

  async findOne(id: number) {
    const item = await this.prisma.delegation.findUnique({ 
      where: { id },
      include: {
        gouvernorat: true
      }
    });
    if (!item) throw new NotFoundException('Delegation not found');
    // Transformer idGouvernorat en id_gouvernorat pour le frontend
    return {
      ...item,
      id_gouvernorat: item.idGouvernorat
    };
  }

  async create(dto: CreateDelegationDto) {
    const delegation = await this.prisma.delegation.create({ 
      data: { nom: dto.nom, idGouvernorat: dto.id_gouvernorat },
      include: {
        gouvernorat: true
      }
    });
    // Transformer idGouvernorat en id_gouvernorat pour le frontend
    return {
      ...delegation,
      id_gouvernorat: delegation.idGouvernorat
    };
  }

  async update(id: number, dto: UpdateDelegationDto) {
    await this.findOne(id);
    const data: any = {};
    if (dto.nom !== undefined && dto.nom !== null) {
      data.nom = dto.nom;
    }
    if (dto.id_gouvernorat !== undefined && dto.id_gouvernorat !== null) {
      data.idGouvernorat = Number(dto.id_gouvernorat);
    }
    const delegation = await this.prisma.delegation.update({ 
      where: { id }, 
      data,
      include: {
        gouvernorat: true
      }
    });
    // Transformer idGouvernorat en id_gouvernorat pour le frontend
    return {
      ...delegation,
      id_gouvernorat: delegation.idGouvernorat
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.delegation.delete({ where: { id } });
    return { message: 'Delegation deleted successfully' };
  }
}


