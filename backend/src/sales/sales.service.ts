import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { QuerySaleDto, SaleStatus } from './dto/query-sale.dto';
import { ValidateSaleDto } from './dto/validate-sale.dto';
import { LogsService } from '../logs/logs.service';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class SalesService {
  private readonly logger = new Logger(SalesService.name);

  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private configService: ConfigService,
  ) {}

  /**
   * Génère un numéro unique pour la vente au format VTE-YYYY-XXXXXX
   */
  private async generateUniqueNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `VTE-${year}-`;

    // Trouver le dernier numéro de l'année
    const lastSale = await this.prisma.sale.findFirst({
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
    if (lastSale) {
      const match = lastSale.numero.match(new RegExp(`^${prefix}(\\d+)$`));
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
   * Crée une vente
   */
  async create(createSaleDto: CreateSaleDto, userId: string) {
    // Vérifier que le vendeur existe
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: createSaleDto.salespersonId },
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
      where: { id: createSaleDto.clientId },
    });

    if (!client) {
      throw new NotFoundException('Client non trouvé');
    }

    // Vérifier que les lignes ne sont pas vides
    if (!createSaleDto.lines || createSaleDto.lines.length === 0) {
      throw new BadRequestException('La vente doit contenir au moins une ligne');
    }

    // Vérifier que tous les produits existent et calculer les prix
    const lines: Array<{
      productId: number;
      qte: number | Decimal;
      prixUnitaire: number;
      montant: Decimal;
    }> = [];
    let montantTotal = new Decimal(0);

    for (const lineDto of createSaleDto.lines) {
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
        createSaleDto.clientId,
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

    // Créer la vente avec ses lignes
    const sale = await this.prisma.sale.create({
      data: {
        numero,
        salespersonId: createSaleDto.salespersonId,
        clientId: createSaleDto.clientId,
        status: 'cree',
        montantTotal,
        remarque: createSaleDto.remarque,
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
      module: 'sale',
      action: 'create',
      recordId: String(sale.id),
      description: `Vente ${sale.numero} créée par salesperson ${salesperson.id}`,
      newData: sale,
    });

    return sale;
  }

  /**
   * Crée une facture de vente à partir d'un bon de livraison validé
   */
  async createFromDeliveryNote(deliveryNoteId: number, userId: string) {
    // Récupérer le bon de livraison avec ses lignes
    const deliveryNote = await this.prisma.deliveryNote.findUnique({
      where: { id: deliveryNoteId },
      include: {
        lines: {
          include: {
            product: true,
          },
        },
        salesperson: true,
        client: true,
      },
    });

    if (!deliveryNote) {
      throw new NotFoundException('Bon de livraison non trouvé');
    }

    // Vérifier que le bon de livraison est validé
    if (deliveryNote.status !== 'valide') {
      throw new BadRequestException(
        `Impossible de créer une facture à partir d'un bon de livraison avec le statut "${deliveryNote.status}". Le bon de livraison doit être validé.`,
      );
    }

    // Vérifier qu'il n'y a pas déjà une facture pour ce bon de livraison
    if (deliveryNote.saleId) {
      throw new BadRequestException(
        'Une facture existe déjà pour ce bon de livraison',
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

    // Préparer les lignes de la facture à partir des lignes du bon de livraison
    const lines: Array<{
      productId: number;
      qte: number | Decimal;
      prixUnitaire: number;
      montant: Decimal;
    }> = [];
    let montantTotal = new Decimal(0);

    for (const line of deliveryNote.lines) {
      const qte = Number(line.qte);
      const prixUnitaire = Number(line.prixUnitaire);
      const montant = new Decimal(qte).mul(new Decimal(prixUnitaire));

      lines.push({
        productId: line.productId,
        qte: qte,
        prixUnitaire: prixUnitaire,
        montant: montant,
      });

      montantTotal = montantTotal.add(montant);
    }

    // Ajouter le timbre fiscal au montant total
    const timbreEnvValue = this.configService.get<string>('TIMBRE');
    const timbreAmount = timbreEnvValue ? parseFloat(timbreEnvValue) : 1.00;
    const montantTotalAvecTimbre = montantTotal.add(new Decimal(timbreAmount));

    this.logger.log(
      `[Sale from BL] Montant total avant timbre: ${montantTotal.toString()} TND. Timbre fiscal (TIMBRE=${timbreEnvValue || 'non défini'}): ${timbreAmount} TND. Montant total final: ${montantTotalAvecTimbre.toString()} TND`,
    );

    // Générer le numéro unique pour la facture
    const numero = await this.generateUniqueNumero();

    // Créer la facture avec ses lignes et lier au bon de livraison
    // La facture est automatiquement validée car elle provient d'un BL déjà validé
    const sale = await this.prisma.sale.create({
      data: {
        numero,
        salespersonId: deliveryNote.salespersonId,
        clientId: deliveryNote.clientId,
        status: 'valide',
        montantTotal: montantTotalAvecTimbre,
        dateValidation: new Date(),
        validatedById: actualUserId,
        remarque: deliveryNote.remarque
          ? `Facture créée depuis le bon de livraison ${deliveryNote.numero}. ${deliveryNote.remarque}`
          : `Facture créée depuis le bon de livraison ${deliveryNote.numero}`,
        createdById: actualUserId,
        deliveryNoteId: deliveryNoteId,
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
        deliveryNote: true,
      },
    });

    // Mettre à jour le bon de livraison pour lier la facture
    await this.prisma.deliveryNote.update({
      where: { id: deliveryNoteId },
      data: {
        saleId: sale.id,
      },
    });

    this.logsService.emitLog({
      userId: actualUserId,
      module: 'sale',
      action: 'create-from-delivery-note',
      recordId: String(sale.id),
      description: `Facture ${sale.numero} créée et validée automatiquement depuis le bon de livraison ${deliveryNote.numero}`,
      newData: sale,
    });

    this.logger.log(
      `Facture ${sale.numero} créée et validée automatiquement depuis le bon de livraison ${deliveryNote.numero} (Stock non décrémenté - déjà décrémenté lors de la validation du BL)`,
    );

    return sale;
  }

  /**
   * Récupère toutes les ventes avec pagination
   */
  async findAll(query: QuerySaleDto) {
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
      const validSortFields = ['id', 'numero', 'status', 'dateVente', 'createdAt', 'updatedAt', 'montantTotal'];
      const sortBy = validSortFields.includes(query.sortBy || '') ? (query.sortBy || 'createdAt') : 'createdAt';
      const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

      const [data, total] = await Promise.all([
        this.prisma.sale.findMany({
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
            deliveryNote: {
              select: {
                id: true,
                numero: true,
              },
            },
          },
        }),
        this.prisma.sale.count({ where }),
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
      this.logger.error('Error in findAll sales:', error);
      throw error;
    }
  }

  /**
   * Récupère une vente par ID
   */
  async findOne(id: number) {
    const sale = await this.prisma.sale.findUnique({
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
        deliveryNote: {
          select: {
            id: true,
            numero: true,
          },
        },
      },
    });

    if (!sale) {
      throw new NotFoundException(`Vente ${id} non trouvée`);
    }

    return sale;
  }

  /**
   * Met à jour une vente
   */
  async update(id: number, updateSaleDto: UpdateSaleDto, userId: string) {
    const sale = await this.findOne(id);

    // Vérifier que la vente est en statut "cree"
    if (sale.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de modifier une vente avec le statut "${sale.status}"`,
      );
    }

    const updateData: any = {};

    if (updateSaleDto.remarque !== undefined) {
      updateData.remarque = updateSaleDto.remarque;
    }

    // Si les lignes sont modifiées, recalculer le montant total
    if (updateSaleDto.lines && updateSaleDto.lines.length > 0) {
      // Supprimer les anciennes lignes
      await this.prisma.saleLine.deleteMany({
        where: { saleId: id },
      });

      // Recalculer les prix et créer les nouvelles lignes
      const lines: Array<{
        productId: number;
        qte: number | Decimal;
        prixUnitaire: number;
        montant: Decimal;
      }> = [];
      let montantTotal = new Decimal(0);

      for (const lineDto of updateSaleDto.lines) {
        const product = await this.prisma.product.findUnique({
          where: { id: lineDto.productId },
        });

        if (!product) {
          throw new NotFoundException(`Produit ${lineDto.productId} non trouvé`);
        }

        const prixUnitaire = await this.getProductPriceForClient(
          lineDto.productId,
          sale.clientId,
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

    const updatedSale = await this.prisma.sale.update({
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
      module: 'sale',
      action: 'update',
      recordId: String(id),
      description: `Vente ${sale.numero} modifiée`,
      oldData: sale,
      newData: updatedSale,
    });

    return updatedSale;
  }

  /**
   * Valide une vente et décrémente le stock (sauf si la facture provient d'un bon de livraison)
   */
  async validate(id: number, validateDto: ValidateSaleDto, userId: string) {
    const sale = await this.findOne(id);

    // Vérifier que la vente est en statut "cree"
    if (sale.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de valider une vente avec le statut "${sale.status}"`,
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

    // Si la facture provient d'un bon de livraison, ne pas vérifier ni décrémenter le stock
    // car le stock a déjà été décrémenté lors de la validation du bon de livraison
    const skipStockDecrement = !!sale.deliveryNoteId;

    if (!skipStockDecrement) {
      // Vérifier le stock disponible pour chaque ligne
      for (const line of sale.lines) {
        const stockTotal = await this.prisma.stockTotal.findUnique({
          where: {
            productId_salespersonId: {
              productId: line.productId,
              salespersonId: sale.salespersonId,
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
    }

    // Mettre à jour le statut
    const updatedSale = await this.prisma.sale.update({
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

    // Décrémenter le stock pour chaque ligne (sauf si la facture provient d'un bon de livraison)
    let stockUpdatedCount = 0;
    
    if (!skipStockDecrement) {
      for (const line of updatedSale.lines) {
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
            salespersonId: sale.salespersonId,
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
              salespersonId: sale.salespersonId,
            },
          },
          data: {
            totalStock: newStock,
          },
        });

        this.logger.log(
          `Stock décrémenté - Produit ${line.productId}, Vendeur ${sale.salespersonId}: ${currentStock} → ${newStock} (-${qte})`,
        );
        stockUpdatedCount++;
      } else {
        this.logger.warn(
          `Stock non trouvé pour Produit ${line.productId}, Vendeur ${sale.salespersonId}`,
        );
      }

      // Créer une StockTransaction de type "sortie"
      const transaction = await this.prisma.stockTransaction.create({
        data: {
          productId: line.productId,
          salespersonId: sale.salespersonId,
          type: 'sortie',
          qte: qte,
          saleId: id,
          reference: sale.numero,
        },
      });

      this.logger.log(
        `Transaction créée - ID: ${transaction.id}, Produit ${line.productId}, Vendeur ${sale.salespersonId}, Quantité: ${qte}`,
      );
      }
    } else {
      this.logger.log(
        `Validation de la facture ${sale.numero} créée depuis le bon de livraison ${sale.deliveryNoteId} - Stock non décrémenté (déjà décrémenté lors de la validation du BL)`,
      );
    }

    if (!skipStockDecrement) {
      this.logger.log(
        `Décrémentation du stock terminée pour la vente ${sale.numero}: ${stockUpdatedCount} produits mis à jour`,
      );
    }

    this.logsService.emitLog({
      userId: actualUserId,
      module: 'sale',
      action: 'validate',
      recordId: String(id),
      description: skipStockDecrement
        ? `Vente ${sale.numero} validée (créée depuis BL ${sale.deliveryNoteId} - stock non décrémenté)`
        : `Vente ${sale.numero} validée - Stock décrémenté`,
      oldData: sale,
      newData: updatedSale,
    });

    return updatedSale;
  }

  /**
   * Supprime une vente
   */
  async remove(id: number, userId: string) {
    const sale = await this.findOne(id);

    // Vérifier que la vente est en statut "cree"
    if (sale.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de supprimer une vente avec le statut "${sale.status}"`,
      );
    }

    await this.prisma.sale.delete({
      where: { id },
    });

    this.logsService.emitLog({
      userId,
      module: 'sale',
      action: 'delete',
      recordId: String(id),
      description: `Vente ${sale.numero} supprimée`,
      oldData: sale,
    });

    return { message: 'Vente supprimée avec succès' };
  }
}

