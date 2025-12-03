import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDeliveryNoteDto } from './dto/create-delivery-note.dto';
import { UpdateDeliveryNoteDto } from './dto/update-delivery-note.dto';
import { QueryDeliveryNoteDto, DeliveryNoteStatus } from './dto/query-delivery-note.dto';
import { ValidateDeliveryNoteDto } from './dto/validate-delivery-note.dto';
import { LogsService } from '../logs/logs.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class DeliveryNotesService {
  private readonly logger = new Logger(DeliveryNotesService.name);

  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  /**
   * Génère un numéro unique pour le bon de livraison au format BL-YYYY-XXXXXX
   */
  private async generateUniqueNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BL-${year}-`;

    // Trouver le dernier numéro de l'année
    const lastNote = await this.prisma.deliveryNote.findFirst({
      where: {
        numero: {
          startsWith: prefix,
        },
      },
      orderBy: {
        numero: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastNote) {
      const match = lastNote.numero.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * Récupère le prix d'un produit pour un client donné
   * Logique identique au module "Consultation et calcul des prix de vente"
   * Priorité: prix spécifique client > prix groupe client > prix tous clients
   * Prend en compte les dates de validité et la quantité minimum
   */
  async getProductPriceForClient(
    productId: number,
    clientId: number,
    quantity: number = 1,
  ): Promise<number> {
    // Récupérer le produit avec son BCItem
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { bcItem: true },
    });

    if (!product || !product.bcItem) {
      throw new NotFoundException(`Produit ${productId} non trouvé ou non lié à un article BC`);
    }

    // Récupérer le client avec son code BC
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new NotFoundException(`Client ${clientId} non trouvé`);
    }

    const now = new Date();
    const itemNumber = product.bcItem.number;
    const itemId = product.bcItem.bcId;

    if (!itemNumber && !itemId) {
      throw new NotFoundException(
        `Le produit ${productId} n'a pas de numéro BC (itemNumber) ni d'ID BC (itemId) pour rechercher les prix`
      );
    }

    // Récupérer tous les prix pour cet item depuis bc_item_prices (avec filtres de dates)
    // Chercher par itemNumber ou itemId (bcId)
    const whereConditions: any = {
      OR: [
        itemNumber ? { itemNumber: itemNumber } : undefined,
        itemId ? { itemId: itemId } : undefined,
      ].filter(Boolean),
      AND: [
        {
          OR: [
            { startingDate: null },
            { startingDate: { lte: now } },
          ],
        },
        {
          OR: [
            { endingDate: null },
            { endingDate: { gte: now } },
          ],
        },
      ],
    };

    const allPrices = await this.prisma.bCItemPrice.findMany({
      where: whereConditions,
    });

    // Filtrer les prix applicables selon les critères (comme dans le module de consultation)
    const applicablePrices = allPrices.filter(price => {
      // Vérifier la quantité minimum
      if (price.minimumQuantity && quantity < Number(price.minimumQuantity)) {
        return false;
      }
      return true;
    });

    if (applicablePrices.length === 0) {
      // Si aucun prix trouvé dans bc_item_prices, lancer une erreur
      throw new NotFoundException(
        `Aucun prix trouvé dans bc_item_prices pour le produit ${productId} (itemNumber: ${itemNumber || 'N/A'}, itemId: ${itemId || 'N/A'}) avec les critères: quantité=${quantity}`
      );
    }

    // Priorité de sélection du prix (identique au module de consultation) :
    // 1. Prix spécifique au client
    // 2. Prix du groupe de prix client
    // 3. Prix pour tous les clients
    let selectedPrice: typeof applicablePrices[0] | null = null;

    // 1. Chercher un prix spécifique au client
    if (client.code) {
      selectedPrice = applicablePrices.find(
        (p) => p.salesType === 'Customer' && p.salesCode === client.code,
      ) || null;
    }

    // 2. Chercher un prix pour un groupe de prix client
    if (!selectedPrice) {
      // Note: On pourrait récupérer le groupe de prix du client depuis la table Client si cette relation existe
      selectedPrice = applicablePrices.find(
        (p) => p.salesType === 'Customer Price Group',
      ) || null;
    }

    // 3. Chercher un prix pour tous les clients
    if (!selectedPrice) {
      selectedPrice = applicablePrices.find(
        (p) => p.salesType === 'All Customers',
      ) || null;
    }

    // 4. Si toujours pas de prix, prendre le premier prix applicable
    if (!selectedPrice) {
      selectedPrice = applicablePrices[0];
    }

    // Vérifier que selectedPrice n'est pas null (ne devrait jamais arriver car on a vérifié applicablePrices.length > 0)
    if (!selectedPrice) {
      throw new NotFoundException(
        `Aucun prix applicable trouvé pour le produit ${productId}`
      );
    }

    return Number(selectedPrice.unitPrice);
  }

  /**
   * Trouve ou crée un utilisateur système pour les salespersons
   */
  private async getOrCreateSystemUser(): Promise<string> {
    // Chercher un utilisateur système existant (email système)
    let systemUser = await this.prisma.user.findFirst({
      where: {
        email: 'system@selos.tn',
      },
    });

    // Si aucun utilisateur système n'existe, en créer un
    if (!systemUser) {
      // Vérifier si un rôle système existe
      let systemRole = await this.prisma.role.findFirst({
        where: {
          name: 'System',
        },
      });

      // Créer le rôle système si nécessaire
      if (!systemRole) {
        systemRole = await this.prisma.role.create({
          data: {
            name: 'System',
            permissions: JSON.stringify(['*']),
          },
        });
      }

      // Créer l'utilisateur système
      systemUser = await this.prisma.user.create({
        data: {
          email: 'system@selos.tn',
          password: 'system', // Mot de passe non utilisé
          firstName: 'Système',
          lastName: 'Selos',
          isActive: true,
          roleId: systemRole.id,
        },
      });
    }

    return systemUser.id;
  }

  /**
   * Crée un bon de livraison
   */
  async create(createDeliveryNoteDto: CreateDeliveryNoteDto, userId: string) {
    // Vérifier que le vendeur existe
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: createDeliveryNoteDto.salespersonId },
    });

    if (!salesperson) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    // Si userId est un salesperson (format: "salesperson-{id}"), utiliser un utilisateur système
    let actualUserId = userId;
    if (userId.startsWith('salesperson-')) {
      actualUserId = await this.getOrCreateSystemUser();
    } else {
      // Vérifier que l'utilisateur existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }
    }

    // Vérifier que le client existe
    const client = await this.prisma.client.findUnique({
      where: { id: createDeliveryNoteDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    // Vérifier que les lignes ne sont pas vides
    if (!createDeliveryNoteDto.lines || createDeliveryNoteDto.lines.length === 0) {
      throw new BadRequestException('Le bon de livraison doit contenir au moins une ligne');
    }

    // Vérifier que tous les produits existent et calculer les prix
    const lines: Array<{
      productId: number;
      qte: number | Decimal;
      prixUnitaire: number;
      montant: Decimal;
    }> = [];
    let montantTotal = new Decimal(0);

    for (const lineDto of createDeliveryNoteDto.lines) {
      // Vérifier que le produit existe
      const product = await this.prisma.product.findUnique({
        where: { id: lineDto.productId },
        include: { bcItem: true },
      });

      if (!product) {
        throw new NotFoundException(`Produit ${lineDto.productId} non trouvé`);
      }

      // Récupérer le prix pour ce client (avec la quantité pour respecter minimumQuantity)
      const prixUnitaire = await this.getProductPriceForClient(
        lineDto.productId,
        createDeliveryNoteDto.clientId,
        Number(lineDto.qte),
      );

      // Calculer le montant de la ligne
      const montant = new Decimal(lineDto.qte).mul(new Decimal(prixUnitaire));

      lines.push({
        productId: lineDto.productId,
        qte: lineDto.qte,
        prixUnitaire: prixUnitaire,
        montant: montant,
      });

      montantTotal = montantTotal.add(montant);
    }

    // Générer le numéro unique
    const numero = await this.generateUniqueNumero();

    // Créer le bon de livraison avec ses lignes
    const deliveryNote = await this.prisma.deliveryNote.create({
      data: {
        numero,
        salespersonId: createDeliveryNoteDto.salespersonId,
        clientId: createDeliveryNoteDto.clientId,
        status: 'cree',
        montantTotal,
        remarque: createDeliveryNoteDto.remarque,
        createdById: actualUserId,
        lines: {
          create: lines,
        },
      },
      include: {
        salesperson: true,
        client: true,
        lines: {
          include: {
            product: {
              include: {
                bcItem: true,
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    this.logsService.emitLog({
      userId: actualUserId,
      module: 'delivery-note',
      action: 'create',
      recordId: String(deliveryNote.id),
      description: `Bon de livraison ${deliveryNote.numero} créé par salesperson ${salesperson.id}`,
      newData: deliveryNote,
    });

    return deliveryNote;
  }

  /**
   * Récupère tous les bons de livraison avec pagination
   */
  async findAll(query: QueryDeliveryNoteDto) {
    try {
      const pageNum = Number(query.page) || 1;
      const limitNum = Number(query.limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const where: any = {};

      if (query.search) {
        // Recherche simplifiée - Prisma peut avoir des problèmes avec les relations imbriquées dans OR
        // On recherche d'abord dans les champs directs
        where.OR = [
          { numero: { contains: query.search, mode: 'insensitive' } },
        ];
        
        // Pour les relations, on utilise une approche différente si nécessaire
        // Note: Les recherches dans les relations peuvent nécessiter des requêtes séparées
        // Pour l'instant, on se limite aux champs directs pour éviter les erreurs
      }

      if (query.status) {
        where.status = query.status;
      }

      if (query.salespersonId) {
        where.salespersonId = Number(query.salespersonId);
      }

      if (query.clientId) {
        where.clientId = Number(query.clientId);
      }

      // Valider que sortBy est un champ valide
      const validSortFields = ['id', 'numero', 'status', 'dateLivraison', 'createdAt', 'updatedAt', 'montantTotal'];
      const sortBy = validSortFields.includes(query.sortBy || '') ? (query.sortBy || 'createdAt') : 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

      const [data, total] = await Promise.all([
        this.prisma.deliveryNote.findMany({
          where,
          skip,
          take: limitNum,
          orderBy: {
            [sortBy]: sortOrder,
          },
          include: {
            salesperson: {
              select: {
                id: true,
                code: true,
                firstName: true,
                lastName: true,
                depotName: true,
              },
            },
            client: {
              select: {
                id: true,
                code: true,
                nom: true,
                nomCommercial: true,
              },
            },
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
            createdBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            validatedBy: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
            sale: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
        }),
        this.prisma.deliveryNote.count({ where }),
      ]);

      return {
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      };
    } catch (error) {
      this.logger.error('Error in findAll delivery notes:', error);
      throw error;
    }
  }

  /**
   * Récupère un bon de livraison par ID
   */
  async findOne(id: number) {
    const deliveryNote = await this.prisma.deliveryNote.findUnique({
      where: { id },
      include: {
        salesperson: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            depotName: true,
          },
        },
        client: {
          select: {
            id: true,
            code: true,
            nom: true,
            nomCommercial: true,
            adresse: true,
            numeroTelephone: true,
          },
        },
        lines: {
          include: {
            product: {
              include: {
                bcItem: {
                  select: {
                    id: true,
                    number: true,
                    displayName: true,
                    baseUnitOfMeasure: true,
                  },
                },
              },
            },
          },
        },
        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        validatedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!deliveryNote) {
      throw new NotFoundException(`Bon de livraison ${id} non trouvé`);
    }

    return deliveryNote;
  }

  /**
   * Met à jour un bon de livraison
   */
  async update(id: number, updateDeliveryNoteDto: UpdateDeliveryNoteDto, userId: string) {
    const deliveryNote = await this.findOne(id);

    // Vérifier que le bon de livraison est en statut "cree"
    if (deliveryNote.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de modifier un bon de livraison avec le statut "${deliveryNote.status}"`,
      );
    }

    const updateData: any = {};

    if (updateDeliveryNoteDto.remarque !== undefined) {
      updateData.remarque = updateDeliveryNoteDto.remarque;
    }

    // Si les lignes sont modifiées, recalculer le montant total
    if (updateDeliveryNoteDto.lines && updateDeliveryNoteDto.lines.length > 0) {
      // Supprimer les anciennes lignes
      await this.prisma.deliveryNoteLine.deleteMany({
        where: { deliveryNoteId: id },
      });

      // Recalculer les prix et créer les nouvelles lignes
      const lines: Array<{
        productId: number;
        qte: number | Decimal;
        prixUnitaire: number;
        montant: Decimal;
      }> = [];
      let montantTotal = new Decimal(0);

      for (const lineDto of updateDeliveryNoteDto.lines) {
        const product = await this.prisma.product.findUnique({
          where: { id: lineDto.productId },
        });

        if (!product) {
          throw new NotFoundException(`Produit ${lineDto.productId} non trouvé`);
        }

        const prixUnitaire = await this.getProductPriceForClient(
          lineDto.productId,
          deliveryNote.clientId,
          Number(lineDto.qte),
        );

        const montant = new Decimal(lineDto.qte).mul(new Decimal(prixUnitaire));

        lines.push({
          productId: lineDto.productId,
          qte: lineDto.qte,
          prixUnitaire: prixUnitaire,
          montant: montant,
        });

        montantTotal = montantTotal.add(montant);
      }

      updateData.montantTotal = montantTotal;
      updateData.lines = {
        create: lines,
      };
    }

    const updatedNote = await this.prisma.deliveryNote.update({
      where: { id },
      data: updateData,
      include: {
        salesperson: true,
        client: true,
        lines: {
          include: {
            product: {
              include: {
                bcItem: true,
              },
            },
          },
        },
      },
    });

    this.logsService.emitLog({
      userId,
      module: 'delivery-note',
      action: 'update',
      recordId: String(id),
      description: `Bon de livraison ${deliveryNote.numero} modifié`,
      oldData: deliveryNote,
      newData: updatedNote,
    });

    return updatedNote;
  }

  /**
   * Valide un bon de livraison et décrémente le stock
   */
  async validate(id: number, validateDto: ValidateDeliveryNoteDto, userId: string) {
    const deliveryNote = await this.findOne(id);

    // Vérifier que le bon de livraison est en statut "cree"
    if (deliveryNote.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de valider un bon de livraison avec le statut "${deliveryNote.status}"`,
      );
    }

    // Si userId est un salesperson (format: "salesperson-{id}"), utiliser un utilisateur système
    let actualUserId = userId;
    if (userId.startsWith('salesperson-')) {
      actualUserId = await this.getOrCreateSystemUser();
    } else {
      // Vérifier que l'utilisateur existe
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) {
        throw new NotFoundException('Utilisateur non trouvé');
      }
    }

    // Vérifier le stock disponible pour chaque ligne
    for (const line of deliveryNote.lines) {
      const stockTotal = await this.prisma.stockTotal.findUnique({
        where: {
          productId_salespersonId: {
            productId: line.productId,
            salespersonId: deliveryNote.salespersonId,
          },
        },
      });

      const stockDisponible = stockTotal ? Number(stockTotal.totalStock) : 0;
      const qteDemandee = Number(line.qte);

      if (stockDisponible < qteDemandee) {
        const product = await this.prisma.product.findUnique({
          where: { id: line.productId },
          include: { bcItem: true },
        });

        throw new BadRequestException(
          `Stock insuffisant pour le produit ${product?.bcItem?.displayName || product?.designation || line.productId}. Stock disponible: ${stockDisponible}, Quantité demandée: ${qteDemandee}`,
        );
      }
    }

    // Mettre à jour le statut
    const updatedNote = await this.prisma.deliveryNote.update({
      where: { id },
      data: {
        status: 'valide',
        dateValidation: new Date(),
        validatedById: actualUserId,
      },
      include: {
        salesperson: true,
        client: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Décrémenter le stock pour chaque ligne
    let stockUpdatedCount = 0;
    for (const line of updatedNote.lines) {
      const qte = Number(line.qte);

      if (qte <= 0) {
        this.logger.warn(`Ligne ${line.id}: Quantité est 0 ou négative, ignorée`);
        continue;
      }

      // Vérifier le stock existant
      const existingStock = await this.prisma.stockTotal.findUnique({
        where: {
          productId_salespersonId: {
            productId: line.productId,
            salespersonId: deliveryNote.salespersonId,
          },
        },
      });

      if (existingStock) {
        const currentStock = Number(existingStock.totalStock);
        const newStock = Math.max(0, currentStock - qte); // Ne pas aller en négatif

        // Mettre à jour le stock
        const updatedStock = await this.prisma.stockTotal.update({
          where: {
            productId_salespersonId: {
              productId: line.productId,
              salespersonId: deliveryNote.salespersonId,
            },
          },
          data: {
            totalStock: newStock,
          },
        });

        this.logger.log(
          `Stock décrémenté - Produit ${line.productId}, Vendeur ${deliveryNote.salespersonId}: ${currentStock} → ${newStock} (-${qte})`,
        );
        stockUpdatedCount++;
      } else {
        this.logger.warn(
          `Stock non trouvé pour Produit ${line.productId}, Vendeur ${deliveryNote.salespersonId}`,
        );
      }

      // Créer une StockTransaction de type "sortie"
      const transaction = await this.prisma.stockTransaction.create({
        data: {
          productId: line.productId,
          salespersonId: deliveryNote.salespersonId,
          type: 'sortie',
          qte: qte,
          deliveryNoteId: id,
          reference: deliveryNote.numero,
        },
      });

      this.logger.log(
        `Transaction créée - ID: ${transaction.id}, Produit ${line.productId}, Vendeur ${deliveryNote.salespersonId}, Quantité: ${qte}`,
      );
    }

    this.logger.log(
      `Décrémentation du stock terminée pour le bon de livraison ${deliveryNote.numero}: ${stockUpdatedCount} produits mis à jour`,
    );

    this.logsService.emitLog({
      userId: actualUserId,
      module: 'delivery-note',
      action: 'validate',
      recordId: String(id),
      description: `Bon de livraison ${deliveryNote.numero} validé - Stock décrémenté`,
      oldData: deliveryNote,
      newData: updatedNote,
    });

    return updatedNote;
  }

  /**
   * Supprime un bon de livraison
   */
  async remove(id: number, userId: string) {
    const deliveryNote = await this.findOne(id);

    // Vérifier que le bon de livraison est en statut "cree"
    if (deliveryNote.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de supprimer un bon de livraison avec le statut "${deliveryNote.status}"`,
      );
    }

    await this.prisma.deliveryNote.delete({
      where: { id },
    });

    this.logsService.emitLog({
      userId,
      module: 'delivery-note',
      action: 'delete',
      recordId: String(id),
      description: `Bon de livraison ${deliveryNote.numero} supprimé`,
      oldData: deliveryNote,
    });

    return { message: 'Bon de livraison supprimé avec succès' };
  }
}

