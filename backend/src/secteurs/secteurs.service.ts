import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSecteurDto } from './dto/create-secteur.dto';
import { UpdateSecteurDto } from './dto/update-secteur.dto';

@Injectable()
export class SecteursService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateSecteurDto) {
    const exists = await this.prisma.secteur.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Secteur name already exists');
    
    const { canalIds, ...secteurData } = dto;
    
    return this.prisma.secteur.create({
      data: {
        ...secteurData,
        secteurCanals: {
          create: canalIds.map((cId) => ({ canalId: cId })),
        },
      },
      include: {
        secteurCanals: {
          include: {
            canal: true,
          },
        },
      },
    });
  }

  async findAll() {
    return this.prisma.secteur.findMany({
      orderBy: { id: 'asc' },
      include: {
        secteurCanals: {
          include: {
            canal: true,
          },
        },
      },
    });
  }

  async findOne(id: number) {
    const secteur = await this.prisma.secteur.findUnique({
      where: { id },
      include: {
        secteurCanals: {
          include: {
            canal: true,
          },
        },
      },
    });
    if (!secteur) throw new NotFoundException('Secteur not found');
    return secteur;
  }

  async update(id: number, dto: UpdateSecteurDto) {
    try {
      await this.findOne(id);
      
      const { canalIds, ...secteurData } = dto;
      
      // Construire les données de mise à jour
      const updateData: any = { ...secteurData };
      
      // Si canalIds est fourni, mettre à jour les relations
      if (canalIds !== undefined && canalIds.length > 0) {
        // Supprimer toutes les relations existantes
        await this.prisma.secteurCanal.deleteMany({
          where: { secteurId: id },
        });
        
        // Créer les nouvelles relations
        await this.prisma.secteurCanal.createMany({
          data: canalIds.map((cId) => ({
            secteurId: id,
            canalId: cId,
          })),
        });
      }
      
      return await this.prisma.secteur.update({
        where: { id },
        data: updateData,
        include: {
          secteurCanals: {
            include: {
              canal: true,
            },
          },
        },
      });
    } catch (error) {
      console.error('Error updating secteur:', error);
      console.error('DTO received:', JSON.stringify(dto, null, 2));
      console.error('Secteur ID:', id);
      throw error;
    }
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.secteur.delete({ where: { id } });
    return { message: 'Secteur deleted successfully' };
  }

  // Associations Secteur-Zone
  async listZones(secteurId: number) {
    await this.findOne(secteurId);
    const links = await this.prisma.secteurZone.findMany({ 
      where: { secteurId }, 
      include: { 
        zone: {
          include: {
            zoneCanals: {
              include: {
                canal: true,
              },
            },
            zoneTypeVentes: {
              include: {
                typeVente: true,
              },
            },
          },
        },
      },
    });
    return links.map((l) => l.zone);
  }

  async addZone(secteurId: number, zoneId: number) {
    await this.findOne(secteurId);
    await this.prisma.zone.findUnique({ where: { id: zoneId } }) || (() => { throw new NotFoundException('Zone not found'); })();
    return this.prisma.secteurZone.upsert({
      where: { secteurId_zoneId: { secteurId, zoneId } },
      update: {},
      create: { secteurId, zoneId },
    });
  }

  async removeZone(secteurId: number, zoneId: number) {
    await this.findOne(secteurId);
    await this.prisma.secteurZone.delete({ where: { secteurId_zoneId: { secteurId, zoneId } } });
    return { message: 'Zone detached from secteur' };
  }

  // Associations Secteur-TypeVente
  async listTypeVentes(secteurId: number) {
    await this.findOne(secteurId);
    const links = await this.prisma.secteurTypeVente.findMany({ where: { secteurId }, include: { typeVente: true } });
    return links.map((l) => l.typeVente);
  }

  async addTypeVente(secteurId: number, typeVenteId: number) {
    await this.findOne(secteurId);
    await this.prisma.typeVente.findUnique({ where: { id: typeVenteId } }) || (() => { throw new NotFoundException('Type vente not found'); })();
    return this.prisma.secteurTypeVente.upsert({
      where: { secteurId_typeVenteId: { secteurId, typeVenteId } },
      update: {},
      create: { secteurId, typeVenteId },
    });
  }

  async removeTypeVente(secteurId: number, typeVenteId: number) {
    await this.findOne(secteurId);
    await this.prisma.secteurTypeVente.delete({ where: { secteurId_typeVenteId: { secteurId, typeVenteId } } });
    return { message: 'Type vente detached from secteur' };
  }
}
