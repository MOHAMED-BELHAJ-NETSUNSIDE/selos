import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateCircuitCommercialDto } from './dto/update-circuit-commercial.dto';

@Injectable()
export class CircuitCommercialService {
  constructor(private prisma: PrismaService) {}

  async getBySecteur(secteurId: number) {
    // Vérifier que le secteur existe
    const secteur = await this.prisma.secteur.findUnique({
      where: { id: secteurId },
      include: { 
        secteurCanals: {
          include: {
            canal: true,
          },
        },
      },
    });
    if (!secteur) {
      throw new NotFoundException('Secteur not found');
    }

    // Récupérer ou créer le circuit commercial
    let circuit = await this.prisma.circuitCommercial.findUnique({
      where: { secteurId },
      include: {
        circuitCommercialZones: {
          include: {
            zone: {
              include: {
                zoneCanals: {
                  include: {
                    canal: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!circuit) {
      circuit = await this.prisma.circuitCommercial.create({
        data: {
          secteurId,
        },
        include: {
          circuitCommercialZones: {
            include: {
              zone: {
                include: {
                  zoneCanals: {
                    include: {
                      canal: true,
                    },
                  },
                },
              },
            },
          },
        },
      });
    }

    return {
      ...circuit,
      secteur,
    };
  }

  async update(secteurId: number, dto: UpdateCircuitCommercialDto) {
    // Vérifier que le secteur existe
    const secteur = await this.prisma.secteur.findUnique({
      where: { id: secteurId },
      include: { 
        secteurCanals: {
          include: {
            canal: true,
          },
        },
      },
    });
    if (!secteur) {
      throw new NotFoundException('Secteur not found');
    }

    // Récupérer ou créer le circuit commercial
    let circuit = await this.prisma.circuitCommercial.findUnique({
      where: { secteurId },
    });

    if (!circuit) {
      circuit = await this.prisma.circuitCommercial.create({
        data: {
          secteurId,
        },
      });
    }

    // Valider que toutes les zones ont au moins un canal en commun avec le secteur
    const secteurCanalIds = secteur.secteurCanals.map((sc) => sc.canalId);
    if (secteurCanalIds.length === 0) {
      throw new BadRequestException('Le secteur doit avoir au moins un canal associé.');
    }

    const zoneIds = dto.zones.map((z) => z.zoneId);
    const zones = await this.prisma.zone.findMany({
      where: { id: { in: zoneIds } },
      include: { 
        zoneCanals: {
          include: {
            canal: true,
          },
        },
      },
    });

    for (const zone of zones) {
      const zoneCanalIds = zone.zoneCanals.map((zc) => zc.canalId);
      const hasCommonCanal = zoneCanalIds.some((zcId) => secteurCanalIds.includes(zcId));
      
      if (!hasCommonCanal) {
        const zoneCanalNoms = zone.zoneCanals.map((zc) => zc.canal.nom).join(', ');
        const secteurCanalNoms = secteur.secteurCanals.map((sc) => sc.canal.nom).join(', ');
        throw new BadRequestException(
          `La zone "${zone.nom}" n'a pas de canal en commun avec le secteur. Le secteur utilise les canaux: ${secteurCanalNoms || 'aucun'}, mais la zone utilise les canaux: ${zoneCanalNoms || 'aucun'}.`
        );
      }
    }

    // Valider les fréquences et groupes
    for (const zoneDto of dto.zones) {
      if (zoneDto.frequence === 'quinzaine') {
        if (!zoneDto.groupes) {
          throw new BadRequestException('Les groupes sont requis pour la fréquence quinzaine');
        }
        const groupes = zoneDto.groupes.split(',').map((g) => g.trim()).sort();
        const validGroupes13 = ['1', '3'].sort();
        const validGroupes24 = ['2', '4'].sort();
        if (groupes.length !== 2 || (!(groupes[0] === validGroupes13[0] && groupes[1] === validGroupes13[1]) && !(groupes[0] === validGroupes24[0] && groupes[1] === validGroupes24[1]))) {
          throw new BadRequestException('Pour la quinzaine, les groupes doivent être "1,3" ou "2,4"');
        }
      } else if (zoneDto.frequence === 'mois') {
        if (!zoneDto.groupes) {
          throw new BadRequestException('Le groupe est requis pour la fréquence mois');
        }
        if (!['1', '2', '3', '4'].includes(zoneDto.groupes.trim())) {
          throw new BadRequestException('Pour le mois, le groupe doit être "1", "2", "3" ou "4"');
        }
      }
    }

    // Supprimer toutes les zones existantes
    await this.prisma.circuitCommercialZone.deleteMany({
      where: { circuitCommercialId: circuit.id },
    });

    // Créer les nouvelles zones
    if (dto.zones.length > 0) {
      await this.prisma.circuitCommercialZone.createMany({
        data: dto.zones.map((z) => ({
          circuitCommercialId: circuit.id,
          zoneId: z.zoneId,
          jour: z.jour,
          frequence: z.frequence,
          groupes: z.groupes || null,
        })),
      });
    }

    // Retourner le circuit mis à jour
    return this.getBySecteur(secteurId);
  }
}

