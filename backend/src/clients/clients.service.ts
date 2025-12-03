import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { QueryClientDto } from './dto/query-client.dto';
import { LogsService } from '../logs/logs.service';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Injectable()
export class ClientsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  /**
   * Génère un code client unique au format CLTXXXX
   */
  private async generateUniqueCode(): Promise<string> {
    // Trouver tous les clients avec un code au format CLTXXXX
    const clientsWithPrefix = await this.prisma.client.findMany({
      where: {
        code: {
          startsWith: 'CLT',
        },
      },
      select: {
        code: true,
      },
      orderBy: {
        code: 'desc',
      },
      take: 1,
    });

    let nextNumber = 1;

    if (clientsWithPrefix.length > 0 && clientsWithPrefix[0]) {
      // Extraire le numéro du dernier code
      const match = clientsWithPrefix[0].code.match(/^CLT(\d+)$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        nextNumber = lastNumber + 1;
      }
    }

    // Formater le code avec 4 chiffres (CLT0001, CLT0002, etc.)
    let code = `CLT${String(nextNumber).padStart(4, '0')}`;

    // Vérifier que le code n'existe pas déjà (sécurité supplémentaire)
    let attempts = 0;
    const maxAttempts = 100; // Limite de sécurité pour éviter les boucles infinies
    
    while (attempts < maxAttempts) {
      const existing = await this.prisma.client.findUnique({
        where: { code },
      });

      if (!existing) {
        return code;
      }

      // Si le code existe, on essaie avec le numéro suivant
      nextNumber++;
      code = `CLT${String(nextNumber).padStart(4, '0')}`;
      attempts++;
    }

    // Si on n'a pas trouvé de code libre après maxAttempts tentatives, on génère un code unique avec timestamp
    return `CLT${Date.now().toString().slice(-4)}`;
  }

  /**
   * Récupère le secteur depuis la localité via zoneLocalites → zone → secteurZones → secteur
   * Retourne le premier secteur trouvé ou null
   */
  private getSecteurFromLocalite(localite: any): any {
    if (!localite?.zoneLocalites || localite.zoneLocalites.length === 0) {
      return null;
    }

    // Parcourir les zones de la localité
    for (const zoneLocalite of localite.zoneLocalites) {
      const zone = zoneLocalite.zone;
      if (zone?.secteurZones && zone.secteurZones.length > 0) {
        // Retourner le premier secteur trouvé
        return zone.secteurZones[0].secteur;
      }
    }

    return null;
  }

  async create(createClientDto: CreateClientDto, userId: string) {
    // Générer le code automatiquement s'il n'est pas fourni
    const code = createClientDto.code || await this.generateUniqueCode();

    const client = await this.prisma.client.create({
      data: {
        ...createClientDto,
        code,
      },
      include: { 
        canal: true, 
        localite: { 
          include: { 
            delegation: { include: { gouvernorat: true } },
            zoneLocalites: {
              include: {
                zone: {
                  include: {
                    secteurZones: {
                      include: {
                        secteur: true
                      }
                    }
                  }
                }
              }
            }
          } 
        }, 
        secteur: true,
        typeClient: true,
        typeVente: true
      },
    });

    // Enrichir le client avec le secteur déduit de la localité si secteurId n'est pas défini
    if (!client.secteur && client.localite) {
      client.secteur = this.getSecteurFromLocalite(client.localite);
    }

    this.logsService.emitLog({
      userId,
      module: 'clients',
      action: 'create',
      recordId: String(client.id),
      description: `Client ${client.code} créé`,
      newData: client,
    });

    return client;
  }

  async findAll(query: QueryClientDto) {
    try {
      const pageNum = Number(query.page) || 1;
      const limitNum = Number(query.limit) || 10;
      const search = query.search;
      const sortBy = query.sortBy || 'id';
      const sortOrder = query.sortOrder || 'desc';
      
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};
      
      // Filtre de recherche globale (si présent, ignore les autres filtres spécifiques)
      if (search) {
        where.OR = [
          { code: { contains: search } },
          { nom: { contains: search } },
          { nomCommercial: { contains: search } },
          { numeroTelephone: { contains: search } },
          { adresse: { contains: search } },
          { registreCommerce: { contains: search } },
        ];
      } else {
        // Filtres spécifiques par colonne (uniquement si pas de recherche globale)
        if (query.code) {
          where.code = { contains: query.code };
        }
        if (query.nom) {
          where.nom = { contains: query.nom };
        }
        if (query.nomCommercial) {
          where.nomCommercial = { contains: query.nomCommercial };
        }
        if (query.numeroTelephone) {
          where.numeroTelephone = { contains: query.numeroTelephone };
        }
        if (query.adresse) {
          where.adresse = { contains: query.adresse };
        }
        if (query.registreCommerce) {
          where.registreCommerce = { contains: query.registreCommerce };
        }
        if (query.typeClientId) {
          where.typeClientId = query.typeClientId;
        }
        if (query.typeVenteId) {
          where.typeVenteId = query.typeVenteId;
        }
        if (query.canalId) {
          where.canalId = query.canalId;
        }
        // Filtre par secteur via la relation Localité → Zone → Secteur
        // Note: secteurId prend le dessus sur localiteId si les deux sont définis
        if (query.secteurId) {
          // Récupérer toutes les zones liées à ce secteur
          const secteurZones = await this.prisma.secteurZone.findMany({
            where: { secteurId: query.secteurId },
            select: { zoneId: true },
          });
          const zoneIds = secteurZones.map(sz => sz.zoneId);
          
          if (zoneIds.length > 0) {
            // Récupérer toutes les localités liées à ces zones
            const zoneLocalites = await this.prisma.zoneLocalite.findMany({
              where: { zoneId: { in: zoneIds } },
              select: { localiteId: true },
            });
            const localiteIds = zoneLocalites.map(zl => zl.localiteId);
            
            if (localiteIds.length > 0) {
              // Si localiteId est aussi défini, faire une intersection
              if (query.localiteId) {
                if (localiteIds.includes(query.localiteId)) {
                  where.localiteId = query.localiteId;
                } else {
                  // La localité spécifiée n'appartient pas au secteur, retourner un résultat vide
                  where.localiteId = { in: [] };
                }
              } else {
                // Filtrer les clients par ces localités
                where.localiteId = { in: localiteIds };
              }
            } else {
              // Aucune localité trouvée, retourner un résultat vide
              where.localiteId = { in: [] };
            }
          } else {
            // Aucune zone trouvée, retourner un résultat vide
            where.localiteId = { in: [] };
          }
        } else if (query.localiteId) {
          // Si seulement localiteId est défini (sans secteurId)
          where.localiteId = query.localiteId;
        }
      }

      // Valider que sortBy est un champ valide (Client n'a pas createdAt/updatedAt)
      const validSortFields = ['id', 'code', 'nom'];
      const sortField = validSortFields.includes(sortBy) ? sortBy : 'id';

      const [clients, total] = await Promise.all([
        this.prisma.client.findMany({
          where,
          include: { 
            canal: true, 
            localite: { 
              include: { 
                delegation: { 
                  include: { 
                    gouvernorat: true 
                  } 
                },
                zoneLocalites: {
                  include: {
                    zone: {
                      include: {
                        secteurZones: {
                          include: {
                            secteur: true
                          }
                        }
                      }
                    }
                  }
                }
              } 
            }, 
            secteur: true,
            typeClient: true,
            typeVente: true
          },
          orderBy: { [sortField]: sortOrder },
          skip,
          take: limitNum,
        }),
        this.prisma.client.count({ where }),
      ]);

      // Enrichir chaque client avec le secteur déduit de la localité si secteurId n'est pas défini
      const enrichedClients = clients.map(client => {
        if (!client.secteur && client.localite) {
          client.secteur = this.getSecteurFromLocalite(client.localite);
        }
        return client;
      });

      return {
        data: enrichedClients,
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      };
    } catch (error) {
      console.error('Error in findAll clients:', error);
      throw error;
    }
  }

  async findOne(id: number) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      include: { 
        canal: true, 
        localite: { 
          include: { 
            delegation: { include: { gouvernorat: true } },
            zoneLocalites: {
              include: {
                zone: {
                  include: {
                    secteurZones: {
                      include: {
                        secteur: true
                      }
                    }
                  }
                }
              }
            }
          } 
        }, 
        secteur: true,
        typeClient: true,
        typeVente: true
      },
    });
    if (!client) throw new NotFoundException('Client not found');
    
    // Enrichir le client avec le secteur déduit de la localité si secteurId n'est pas défini
    if (!client.secteur && client.localite) {
      client.secteur = this.getSecteurFromLocalite(client.localite);
    }
    
    return client;
  }

  async update(id: number, updateClientDto: UpdateClientDto, userId: string) {
    const before = await this.findOne(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: updateClientDto,
      include: { 
        canal: true, 
        localite: { 
          include: { 
            delegation: { include: { gouvernorat: true } },
            zoneLocalites: {
              include: {
                zone: {
                  include: {
                    secteurZones: {
                      include: {
                        secteur: true
                      }
                    }
                  }
                }
              }
            }
          } 
        }, 
        secteur: true,
        typeClient: true,
        typeVente: true
      },
    });

    // Enrichir le client avec le secteur déduit de la localité si secteurId n'est pas défini
    if (!client.secteur && client.localite) {
      client.secteur = this.getSecteurFromLocalite(client.localite);
    }

    this.logsService.emitLog({
      userId,
      module: 'clients',
      action: 'update',
      recordId: String(id),
      description: `Client ${client.code} modifié`,
      oldData: before,
      newData: client,
    });

    return client;
  }

  /**
   * Récupère les statistiques d'un client (chiffre d'affaires, meilleur produit)
   */
  async getClientStatistics(clientId: number) {
    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client ${clientId} non trouvé`);
    }

    // Récupérer tous les bons de livraison validés pour ce client (pour le chiffre d'affaires)
    const deliveryNotesValides = await this.prisma.deliveryNote.findMany({
      where: {
        clientId: clientId,
        status: 'valide',
      },
      include: {
        lines: {
          include: {
            product: {
              include: {
                bcItem: {
                  select: {
                    id: true,
                    number: true,
                    displayName: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // Récupérer le nombre total de bons de livraison (tous statuts sauf annulés)
    const totalDeliveryNotes = await this.prisma.deliveryNote.count({
      where: {
        clientId: clientId,
        status: {
          not: 'annule',
        },
      },
    });

    // Calculer le chiffre d'affaires total à partir de la somme des montants des lignes (plus précis)
    let chiffreAffaires = 0;
    const productStats = new Map<
      number,
      { product: any; totalAmount: number; totalQuantity: number }
    >();

    deliveryNotesValides.forEach((note) => {
      note.lines.forEach((line) => {
        const lineAmount = Number(line.montant);
        chiffreAffaires += lineAmount;

        const productId = line.productId;
        const current = productStats.get(productId) || {
          product: line.product,
          totalAmount: 0,
          totalQuantity: 0,
        };
        current.totalAmount += lineAmount;
        current.totalQuantity += Number(line.qte);
        productStats.set(productId, current);
      });
    });

    // Trouver le meilleur produit (celui avec le plus grand montant total)
    let bestProduct: {
      product: any;
      totalAmount: number;
      totalQuantity: number;
    } | null = null;
    let bestProductAmount = 0;

    productStats.forEach((stats) => {
      if (stats.totalAmount > bestProductAmount) {
        bestProductAmount = stats.totalAmount;
        bestProduct = {
          product: stats.product,
          totalAmount: stats.totalAmount,
          totalQuantity: stats.totalQuantity,
        };
      }
    });

    return {
      chiffreAffaires,
      nombreBonsLivraison: totalDeliveryNotes,
      meilleurProduit: bestProduct,
      nombreProduits: productStats.size,
    };
  }

  async remove(id: number, userId: string) {
    const before = await this.findOne(id);
    await this.prisma.client.delete({ where: { id } });

    this.logsService.emitLog({
      userId,
      module: 'clients',
      action: 'delete',
      recordId: String(id),
      description: `Client ${before.code} supprimé`,
      oldData: before,
      newData: null,
    });

    return { message: 'Client deleted successfully' };
  }
}


