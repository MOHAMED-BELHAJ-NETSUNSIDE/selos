import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateZoneDto } from './dto/create-zone.dto';
import { UpdateZoneDto } from './dto/update-zone.dto';

@Injectable()
export class ZonesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateZoneDto) {
    const exists = await this.prisma.zone.findFirst({ where: { nom: dto.nom } });
    if (exists) throw new ConflictException('Zone name already exists');
    
    const { typeVenteIds, canalIds, localiteIds, ...zoneData } = dto;
    
    return this.prisma.zone.create({
      data: {
        ...zoneData,
        zoneTypeVentes: {
          create: typeVenteIds.map((tvId) => ({ typeVenteId: tvId })),
        },
        zoneCanals: {
          create: canalIds.map((cId) => ({ canalId: cId })),
        },
        zoneLocalites: localiteIds && localiteIds.length > 0 ? {
          create: localiteIds.map((lId) => ({ localiteId: lId })),
        } : undefined,
      },
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
        zoneLocalites: {
          include: {
            localite: {
              include: {
                delegation: {
                  include: {
                    gouvernorat: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async findAll() {
    const zones = await this.prisma.zone.findMany({
      orderBy: { id: 'asc' },
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
        zoneLocalites: {
          include: {
            localite: {
              include: {
                delegation: {
                  include: {
                    gouvernorat: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Compter les clients pour chaque zone
    const zonesWithClientCount = await Promise.all(
      zones.map(async (zone) => {
        // Récupérer les IDs des localités de cette zone
        const localiteIds = zone.zoneLocalites?.map(zl => zl.localiteId) || [];
        
        // Compter les clients dont la localité est dans cette zone
        const clientCount = localiteIds.length > 0
          ? await this.prisma.client.count({
              where: {
                localiteId: {
                  in: localiteIds,
                },
              },
            })
          : 0;

        return {
          ...zone,
          clientCount,
        };
      })
    );

    return zonesWithClientCount;
  }

  async findOne(id: number) {
    const zone = await this.prisma.zone.findUnique({
      where: { id },
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
        zoneLocalites: {
          include: {
            localite: {
              include: {
                delegation: {
                  include: {
                    gouvernorat: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!zone) throw new NotFoundException('Zone not found');
    
    // Compter les clients pour cette zone
    const localiteIds = zone.zoneLocalites?.map(zl => zl.localiteId) || [];
    const clientCount = localiteIds.length > 0
      ? await this.prisma.client.count({
          where: {
            localiteId: {
              in: localiteIds,
            },
          },
        })
      : 0;

    return {
      ...zone,
      clientCount,
    };
  }

  async update(id: number, dto: UpdateZoneDto) {
    await this.findOne(id);
    
    const { typeVenteIds, canalIds, localiteIds, frequenceVisite, ...zoneData } = dto;
    
    // Construire les données de mise à jour
    const updateData: any = { ...zoneData };
    
    // frequenceVisite est maintenant obligatoire, toujours l'inclure
    if (frequenceVisite !== undefined) {
      updateData.frequenceVisite = frequenceVisite;
    }
    
    // Si canalIds est fourni, mettre à jour les relations
    if (canalIds !== undefined && canalIds.length > 0) {
      // Supprimer toutes les relations existantes
      await this.prisma.zoneCanal.deleteMany({
        where: { zoneId: id },
      });
      
      // Créer les nouvelles relations
      await this.prisma.zoneCanal.createMany({
        data: canalIds.map((cId) => ({
          zoneId: id,
          canalId: cId,
        })),
      });
    }
    
    // Si typeVenteIds est fourni, mettre à jour les relations
    if (typeVenteIds !== undefined && typeVenteIds.length > 0) {
      // Supprimer toutes les relations existantes
      await this.prisma.zoneTypeVente.deleteMany({
        where: { zoneId: id },
      });
      
      // Créer les nouvelles relations
      await this.prisma.zoneTypeVente.createMany({
        data: typeVenteIds.map((tvId) => ({
          zoneId: id,
          typeVenteId: tvId,
        })),
      });
    }
    
    // Si localiteIds est fourni, mettre à jour les relations
    if (localiteIds !== undefined) {
      // Supprimer toutes les relations existantes
      await this.prisma.zoneLocalite.deleteMany({
        where: { zoneId: id },
      });
      
      // Créer les nouvelles relations si le tableau n'est pas vide
      if (localiteIds.length > 0) {
        await this.prisma.zoneLocalite.createMany({
          data: localiteIds.map((lId) => ({
            zoneId: id,
            localiteId: lId,
          })),
        });
      }
    }
    
    return this.prisma.zone.update({
      where: { id },
      data: updateData,
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
        zoneLocalites: {
          include: {
            localite: {
              include: {
                delegation: {
                  include: {
                    gouvernorat: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.zone.delete({ where: { id } });
    return { message: 'Zone deleted successfully' };
  }
}


