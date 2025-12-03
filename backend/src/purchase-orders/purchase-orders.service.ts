import { Injectable, NotFoundException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderDto } from './dto/update-purchase-order.dto';
import { QueryPurchaseOrderDto } from './dto/query-purchase-order.dto';
import { ValidatePurchaseOrderDto } from './dto/validate-purchase-order.dto';
import { LogsService } from '../logs/logs.service';
import { BusinessCentralService } from '../business-central/business-central.service';

@Injectable()
export class PurchaseOrdersService {
  private readonly logger = new Logger(PurchaseOrdersService.name);

  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
    private bcService: BusinessCentralService,
    private configService: ConfigService,
  ) {}

  /**
   * Génère un numéro unique pour le bon de commande au format BC-YYYY-XXXXXX
   */
  private async generateUniqueNumero(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `BC-${year}-`;

    // Trouver le dernier numéro de l'année
    const lastOrder = await this.prisma.purchaseOrder.findFirst({
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
    if (lastOrder) {
      const match = lastOrder.numero.match(new RegExp(`^${prefix}(\\d+)$`));
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `${prefix}${String(nextNumber).padStart(6, '0')}`;
  }

  /**
   * Crée un bon de commande depuis un chargement type
   */
  async createFromChargementType(chargementTypeId: number, userId: string, locationId?: string | null) {
    // Récupérer le chargement type avec ses produits
    const chargementType = await this.prisma.chargementType.findUnique({
      where: { id: chargementTypeId },
      include: {
        salesperson: true,
        products: true,
      },
    });

    if (!chargementType) {
      throw new NotFoundException('Chargement type not found');
    }

    // Vérifier que le chargement type a des produits
    if (!chargementType.products || chargementType.products.length === 0) {
      throw new BadRequestException('Le chargement type ne contient aucun produit');
    }

    // Vérifier qu'un bon de commande avec un statut pas encore envoyé à BC n'existe pas déjà
    // On bloque seulement si le statut est 'non_valide' ou 'valide'
    const existingOrder = await this.prisma.purchaseOrder.findFirst({
      where: { 
        chargementTypeId,
        status: { in: ['non_valide', 'valide'] }
      },
    });

    if (existingOrder) {
      throw new ConflictException(`Un bon de commande avec le statut "${existingOrder.status}" existe déjà pour ce chargement type. Vous devez d'abord valider ou annuler ce bon de commande.`);
    }

    // Récupérer tous les bcIds des produits du chargement type
    const bcIds = chargementType.products.map(p => p.productId);

    // Trouver les BCItems correspondants
    const bcItems = await this.prisma.bCItem.findMany({
      where: { bcId: { in: bcIds } },
    });

    if (bcItems.length !== bcIds.length) {
      const foundIds = new Set(bcItems.map(item => item.bcId));
      const missingIds = bcIds.filter(id => !foundIds.has(id));
      throw new NotFoundException(`BCItems not found: ${missingIds.join(', ')}`);
    }

    // Créer un Map pour faciliter la recherche
    // Type explicite pour le Map basé sur le type retourné par Prisma
    const bcItemsMap = new Map<string, (typeof bcItems)[0]>(
      bcItems.map(item => [item.bcId, item])
    );

    // Pour chaque produit du chargement type, trouver le Product correspondant
    // et calculer la quantité à charger = chargement type qte - stock actuel
    const orderLines: Array<{ productId: number; qte: any }> = [];
    for (const ctProduct of chargementType.products) {
      const bcItem = bcItemsMap.get(ctProduct.productId);
      if (!bcItem) {
        throw new NotFoundException(`BCItem ${ctProduct.productId} not found`);
      }

      // Trouver le Product correspondant via bcItemId, ou le créer s'il n'existe pas
      let product = await this.prisma.product.findFirst({
        where: { bcItemId: bcItem.bcId },
      });

      if (!product) {
        // Créer automatiquement le Product à partir du BCItem
        product = await this.prisma.product.create({
          data: {
            designation: bcItem.displayName || bcItem.number || 'Produit sans nom',
            ref: bcItem.number || null,
            bcItemId: bcItem.bcId,
            etatProduit: 1,
          },
        });
      }

      // Récupérer le stock actuel du vendeur pour ce produit
      const currentStock = await this.prisma.stockTotal.findUnique({
        where: {
          productId_salespersonId: {
            productId: product.id,
            salespersonId: chargementType.salespersonId,
          },
        },
      });

      // Calculer la quantité à charger = chargement type qte - stock actuel
      const chargementTypeQte = Number(ctProduct.qte);
      const stockActuel = currentStock ? Number(currentStock.totalStock) : 0;
      const qteToCharge = Math.max(0, chargementTypeQte - stockActuel);

      // Ne créer une ligne que si la quantité à charger > 0
      if (qteToCharge > 0) {
        orderLines.push({
          productId: product.id,
          qte: qteToCharge,
        });
        
        this.logger.log(
          `Produit ${product.designation}: Chargement type qte=${chargementTypeQte}, Stock actuel=${stockActuel}, Quantité à charger=${qteToCharge}`,
        );
      } else {
        this.logger.log(
          `Produit ${product.designation}: Chargement type qte=${chargementTypeQte}, Stock actuel=${stockActuel}, Quantité à charger=0 (ignoré)`,
        );
      }
    }

    // Vérifier qu'au moins une ligne a été créée
    if (orderLines.length === 0) {
      throw new BadRequestException(
        'Aucune quantité à charger : tous les produits ont déjà un stock suffisant par rapport au chargement type',
      );
    }

    // Générer le numéro unique
    const numero = await this.generateUniqueNumero();

    // Créer le bon de commande avec ses lignes
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        numero,
        salespersonId: chargementType.salespersonId,
        chargementTypeId: chargementType.id,
        bcLocationId: locationId ? String(locationId) : null,
        status: 'non_valide',
        createdById: userId,
        lines: {
          create: orderLines,
        },
      },
      include: {
        salesperson: true,
        chargementType: true,
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
      userId,
      module: 'purchase-order',
      action: 'create',
      recordId: String(purchaseOrder.id),
      description: `Bon de commande ${purchaseOrder.numero} créé depuis chargement type`,
      newData: purchaseOrder,
    });

    return purchaseOrder;
  }

  /**
   * Crée un bon de commande manuellement
   */
  async create(createPurchaseOrderDto: CreatePurchaseOrderDto, userId: string) {
    // Vérifier que le vendeur existe
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: createPurchaseOrderDto.salespersonId },
    });

    if (!salesperson) {
      throw new NotFoundException('Salesperson not found');
    }

    // Si un chargementTypeId est fourni, vérifier qu'un bon de commande avec un statut pas encore envoyé à BC n'existe pas déjà
    // On bloque seulement si le statut est 'non_valide' ou 'valide'
    if (createPurchaseOrderDto.chargementTypeId) {
      const existing = await this.prisma.purchaseOrder.findFirst({
        where: { 
          chargementTypeId: createPurchaseOrderDto.chargementTypeId,
          status: { in: ['non_valide', 'valide'] }
        },
      });

      if (existing) {
        throw new ConflictException(`Un bon de commande avec le statut "${existing.status}" existe déjà pour ce chargement type. Vous devez d'abord valider ou annuler ce bon de commande.`);
      }
    }

    // Générer le numéro unique
    const numero = await this.generateUniqueNumero();

    // Préparer les lignes
    const lines = createPurchaseOrderDto.lines || [];

    // Vérifier que tous les produits existent
    if (lines.length > 0) {
      const productIds = lines.map(l => l.productId);
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
      });

      if (products.length !== productIds.length) {
        const foundIds = new Set(products.map(p => p.id));
        const missingIds = productIds.filter(id => !foundIds.has(id));
        throw new NotFoundException(`Products not found: ${missingIds.join(', ')}`);
      }
    }

    // Créer le bon de commande
    const purchaseOrder = await this.prisma.purchaseOrder.create({
      data: {
        numero,
        salespersonId: createPurchaseOrderDto.salespersonId,
        chargementTypeId: createPurchaseOrderDto.chargementTypeId,
        status: 'non_valide',
        remarque: createPurchaseOrderDto.remarque,
        createdById: userId,
        lines: {
          create: lines,
        },
      },
      include: {
        salesperson: true,
        chargementType: true,
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
      userId,
      module: 'purchase-order',
      action: 'create',
      recordId: String(purchaseOrder.id),
      description: `Bon de commande ${purchaseOrder.numero} créé`,
      newData: purchaseOrder,
    });

    return purchaseOrder;
  }

  async findAll(query: QueryPurchaseOrderDto) {
    const pageNum = Number(query.page) || 1;
    const limitNum = Number(query.limit) || 10;
    const skip = (pageNum - 1) * limitNum;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    // Filtre de recherche globale
    if (query.search) {
      where.OR = [
        { numero: { contains: query.search } },
        { salesperson: { code: { contains: query.search } } },
        { salesperson: { firstName: { contains: query.search } } },
        { salesperson: { lastName: { contains: query.search } } },
        { bcNumber: { contains: query.search } },
      ];
    }

    // Filtres spécifiques
    if (query.status) {
      where.status = query.status;
    }

    if (query.salespersonId) {
      where.salespersonId = query.salespersonId;
    }

    if (query.chargementTypeId) {
      where.chargementTypeId = query.chargementTypeId;
    }

    const [purchaseOrders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          salesperson: true,
          chargementType: true,
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
          validatedBy: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limitNum,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data: purchaseOrders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    };
  }

  async findOne(id: number) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        salesperson: true,
        chargementType: {
          include: {
            products: true,
          },
        },
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
        validatedBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        purchaseInvoice: {
          include: {
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
        },
        stockTransactions: true,
      },
    });

    if (!purchaseOrder) {
      throw new NotFoundException('Purchase order not found');
    }

    return purchaseOrder;
  }

  async update(id: number, updatePurchaseOrderDto: UpdatePurchaseOrderDto, userId: string) {
    const before = await this.findOne(id);

    // Vérifier que le bon de commande n'est pas déjà validé
    if (before.status !== 'non_valide') {
      throw new BadRequestException('Impossible de modifier un bon de commande déjà validé ou annulé');
    }

    // Exclure lines de updatePurchaseOrderDto car les lignes doivent être gérées séparément
    const { lines, ...updateData } = updatePurchaseOrderDto;

    const purchaseOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: updateData,
      include: {
        salesperson: true,
        chargementType: true,
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
      userId,
      module: 'purchase-order',
      action: 'update',
      recordId: String(id),
      description: `Bon de commande ${purchaseOrder.numero} modifié`,
      oldData: before,
      newData: purchaseOrder,
    });

    return purchaseOrder;
  }

  /**
   * Valide un bon de commande
   * - Envoie vers Business Central (obligatoire)
   * - Crée la facture d'achat
   * Note: L'alimentation du stock se fait lors du passage en statut "expedie"
   */
  async validate(id: number, validateDto: ValidatePurchaseOrderDto, userId: string) {
    const purchaseOrder = await this.findOne(id);

    // Vérifier que le bon de commande est en statut "non_valide"
    if (purchaseOrder.status !== 'non_valide') {
      throw new BadRequestException(`Impossible de valider un bon de commande avec le statut "${purchaseOrder.status}"`);
    }

    // Récupérer le vendeur avec son client BC
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: purchaseOrder.salespersonId },
      include: { bcCustomer: true },
    });

    if (!salesperson) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    // Récupérer le numéro client depuis le vendeur (bcCode ou number du client BC)
    let clientNumber = validateDto.clientNumber;
    if (!clientNumber) {
      if (salesperson.bcCode) {
        clientNumber = salesperson.bcCode;
      } else if (salesperson.bcCustomer?.number) {
        clientNumber = salesperson.bcCustomer.number;
      } else {
        throw new BadRequestException(
          'Le vendeur n\'est pas lié à un client Business Central. Veuillez fournir un numéro client ou lier le vendeur à un client BC.',
        );
      }
    }

    // S'assurer que clientNumber est défini (ne devrait jamais être undefined à ce stade)
    if (!clientNumber) {
      throw new BadRequestException(
        'Le numéro client est requis pour créer la commande sur Business Central.',
      );
    }

    // Récupérer le bcId (GUID) du magasin si un magasin est associé
    // Selon la documentation Microsoft, salesOrderLine utilise locationId (GUID)
    // bcLocationId est maintenant directement le bcId (GUID)
    const locationBcId: string | null = purchaseOrder.bcLocationId || null;

    // Créer le bon de commande (sales order) sur Business Central
    // Note: On crée un salesOrder car le vendeur est lié à un client BC
    const bcResult = await this.bcService.createSalesOrderOnBC({
      customerNumber: clientNumber,
      orderDate: purchaseOrder.dateCommande.toISOString().split('T')[0],
      requestedDeliveryDate: validateDto.dateReception,
      currencyCode: validateDto.currency || 'TND',
    });

    if (!bcResult.success) {
      throw new BadRequestException(
        bcResult.error || 'Erreur lors de la création du bon de commande sur Business Central',
      );
    }

    if (!bcResult.bcId) {
      throw new BadRequestException('Business Central n\'a pas retourné d\'ID pour le bon de commande');
    }

    // Récupérer le bon de commande avec toutes les lignes et produits
    const purchaseOrderWithLines = await this.findOne(id);

    // Si des quantités modifiées sont fournies, mettre à jour les lignes
    if (validateDto.lines && validateDto.lines.length > 0) {
      // Créer un Map pour faciliter la recherche des quantités modifiées
      const modifiedQuantitiesMap = new Map(
        validateDto.lines.map(l => [l.lineId, l.qte])
      );

      // Vérifier et mettre à jour chaque ligne
      for (const line of purchaseOrderWithLines.lines) {
        const modifiedQte = modifiedQuantitiesMap.get(line.id);
        
        if (modifiedQte !== undefined) {
          // Vérifier que la quantité modifiée ne dépasse pas la quantité initiale
          const originalQte = Number(line.qte);
          const newQte = Number(modifiedQte);

          if (newQte > originalQte) {
            throw new BadRequestException(
              `La quantité pour le produit "${line.product.designation}" ne peut pas être augmentée. Quantité initiale: ${originalQte}, Quantité proposée: ${newQte}`
            );
          }

          if (newQte < 0) {
            throw new BadRequestException(
              `La quantité pour le produit "${line.product.designation}" ne peut pas être négative`
            );
          }

          // Mettre à jour la quantité de la ligne
          await this.prisma.purchaseOrderLine.update({
            where: { id: line.id },
            data: { qte: newQte },
          });
        }
      }

      // Recharger le bon de commande avec les quantités mises à jour
      const updatedPurchaseOrder = await this.findOne(id);
      purchaseOrderWithLines.lines = updatedPurchaseOrder.lines;
    }

    // Ajouter les lignes du bon de commande sur BC
    const bcOrderId = bcResult.bcId;
    const linesErrors: string[] = [];

    for (const line of purchaseOrderWithLines.lines) {
      // Récupérer le BCItem pour obtenir le bcId
      const product = await this.prisma.product.findUnique({
        where: { id: line.productId },
        include: { bcItem: true },
      });

      if (!product || !product.bcItem) {
        linesErrors.push(`Produit ${line.product.designation} n'est pas lié à un article BC`);
        continue;
      }

      const lineResult = await this.bcService.addSalesOrderLineToBC(
        bcOrderId,
        product.bcItem.bcId,
        Number(line.qte),
        validateDto.currency || 'TND',
        locationBcId || undefined,
      );

      if (!lineResult.success) {
        linesErrors.push(`Ligne ${line.product.designation}: ${lineResult.error || 'Erreur inconnue'}`);
      }
    }

    // Si toutes les lignes ont échoué, on peut considérer que la commande est incomplète
    // Mais on continue quand même car la commande a été créée sur BC
    if (linesErrors.length > 0 && linesErrors.length === purchaseOrderWithLines.lines.length) {
      throw new BadRequestException(
        `Le bon de commande a été créé sur BC mais aucune ligne n'a pu être ajoutée: ${linesErrors.join('; ')}`,
      );
    }

    const bcId = bcResult.bcId;
    const bcNumber = bcResult.bcNumber || purchaseOrder.numero;
    const bcEtag = bcResult.bcEtag || null;

    // Mettre à jour le bon de commande avec les infos BC
    // On ne récupère pas le statut BC, ni les informations de shipment/invoice à la validation
    // Ces informations seront récupérées plus tard via refreshBCStatus ou lors du marquage comme expédié
    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'envoye_bc',
        dateValidation: new Date(),
        dateEnvoiBC: new Date(),
        validatedById: userId,
        bcId,
        bcNumber,
        bcEtag,
        bcStatus: null, // Le statut BC sera récupéré plus tard via refreshBCStatus
        bcFullyShipped: null,
        bcShipmentNumber: null,
        bcInvoiced: null,
        bcInvoiceNumber: null,
        bcLastModified: new Date(),
      },
      include: {
        salesperson: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Récupérer le bon de commande complet pour le retour
    const finalOrder = await this.findOne(id);

    this.logsService.emitLog({
      userId,
      module: 'purchase-order',
      action: 'update',
      recordId: String(id),
      description: `Bon de commande ${purchaseOrder.numero} validé et envoyé vers BC`,
      oldData: purchaseOrder,
      newData: finalOrder,
    });

    return finalOrder;
  }

  /**
   * Marque un bon de commande comme expédié et alimente le stock
   * - Vérifie que le statut est "envoye_bc"
   * - Met à jour le statut à "expedie"
   * - Alimente le stock (StockTotal, StockTransaction)
   * - Met à jour les quantités reçues
   */
  async markAsExpedie(id: number, userId: string) {
    const purchaseOrder = await this.findOne(id);

    // Vérifier que le bon de commande est en statut "envoye_bc"
    if (purchaseOrder.status !== 'envoye_bc') {
      throw new BadRequestException(
        `Impossible de marquer comme expédié un bon de commande avec le statut "${purchaseOrder.status}". Le statut doit être "envoye_bc".`,
      );
    }

    // Mettre à jour le statut à "expedie"
    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'expedie',
      },
      include: {
        salesperson: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Alimenter le stock pour chaque ligne avec les quantités reçues
    let stockUpdatedCount = 0;
    for (const line of updatedOrder.lines) {
      // Utiliser la quantité reçue (qteRecue) au lieu de la quantité commandée (qte)
      const qteRecue = Number(line.qteRecue) || 0;
      
      // Si aucune quantité reçue n'est définie, utiliser la quantité commandée comme fallback
      const qteToAdd = qteRecue > 0 ? qteRecue : Number(line.qte) || 0;
      
      this.logger.log(
        `Alimentation stock - Ligne ${line.id}: qteRecue=${qteRecue}, qte=${Number(line.qte)}, qteToAdd=${qteToAdd}`,
      );
      
      if (qteToAdd <= 0) {
        // Pas de quantité à ajouter, passer à la ligne suivante
        this.logger.warn(`Ligne ${line.id}: Quantité à ajouter est 0 ou négative, ignorée`);
        continue;
      }

      // Vérifier si StockTotal existe déjà
      const existingStock = await this.prisma.stockTotal.findUnique({
        where: {
          productId_salespersonId: {
            productId: line.productId,
            salespersonId: purchaseOrder.salespersonId,
          },
        },
      });

      if (existingStock) {
        // Mettre à jour le stock existant avec la quantité reçue
        const updatedStock = await this.prisma.stockTotal.update({
          where: {
            productId_salespersonId: {
              productId: line.productId,
              salespersonId: purchaseOrder.salespersonId,
            },
          },
          data: {
            totalStock: {
              increment: qteToAdd,
            },
          },
        });
        this.logger.log(
          `Stock mis à jour - Produit ${line.productId}, Vendeur ${purchaseOrder.salespersonId}: ${Number(existingStock.totalStock)} → ${Number(updatedStock.totalStock)} (+${qteToAdd})`,
        );
        stockUpdatedCount++;
      } else {
        // Créer un nouveau StockTotal avec la quantité reçue
        const newStock = await this.prisma.stockTotal.create({
          data: {
            productId: line.productId,
            salespersonId: purchaseOrder.salespersonId,
            totalStock: qteToAdd,
          },
        });
        this.logger.log(
          `Nouveau stock créé - Produit ${line.productId}, Vendeur ${purchaseOrder.salespersonId}: ${Number(newStock.totalStock)}`,
        );
        stockUpdatedCount++;
      }

      // Créer une StockTransaction avec la quantité reçue
      const transaction = await this.prisma.stockTransaction.create({
        data: {
          productId: line.productId,
          salespersonId: purchaseOrder.salespersonId,
          type: 'entree',
          qte: qteToAdd,
          purchaseOrderId: id,
          reference: purchaseOrder.numero,
        },
      });
      this.logger.log(
        `Transaction créée - ID: ${transaction.id}, Produit ${line.productId}, Vendeur ${purchaseOrder.salespersonId}, Quantité: ${qteToAdd}`,
      );
    }

    this.logger.log(
      `Alimentation du stock terminée pour le bon de commande ${purchaseOrder.numero}: ${stockUpdatedCount} ligne(s) de stock mise(s) à jour`,
    );

    // Récupérer le bon de commande complet pour le retour
    const finalOrder = await this.findOne(id);

    this.logsService.emitLog({
      userId,
      module: 'purchase-order',
      action: 'update',
      recordId: String(id),
      description: `Bon de commande ${purchaseOrder.numero} marqué comme expédié - Stock alimenté`,
      oldData: purchaseOrder,
      newData: finalOrder,
    });

    return finalOrder;
  }

  /**
   * Annule un bon de commande
   */
  async cancel(id: number, userId: string) {
    const purchaseOrder = await this.findOne(id);

    // Vérifier que le bon de commande peut être annulé
    if (purchaseOrder.status === 'annule') {
      throw new BadRequestException('Le bon de commande est déjà annulé');
    }

    if (purchaseOrder.status === 'envoye_bc') {
      throw new BadRequestException('Impossible d\'annuler un bon de commande qui a été envoyé à Business Central');
    }

    const updatedOrder = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        status: 'annule',
      },
      include: {
        salesperson: true,
        chargementType: true,
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
      module: 'purchase-order',
      action: 'update',
      recordId: String(id),
      description: `Bon de commande ${purchaseOrder.numero} annulé`,
      oldData: purchaseOrder,
      newData: updatedOrder,
    });

    return updatedOrder;
  }

  async remove(id: number, userId: string) {
    const before = await this.findOne(id);

    // Vérifier que le bon de commande peut être supprimé
    if (before.status !== 'non_valide') {
      throw new BadRequestException('Impossible de supprimer un bon de commande validé ou annulé');
    }

    await this.prisma.purchaseOrder.delete({
      where: { id },
    });

    this.logsService.emitLog({
      userId,
      module: 'purchase-order',
      action: 'delete',
      recordId: String(id),
      description: `Bon de commande ${before.numero} supprimé`,
      oldData: before,
      newData: null,
    });

    return { message: 'Purchase order deleted successfully' };
  }

  /**
   * Récupère tous les produits disponibles pour créer un bon de commande
   */
  async getAvailableProducts() {
    const products = await this.prisma.product.findMany({
      where: {
        bcItemId: {
          not: null,
        },
      },
      include: {
        bcItem: true,
      },
      orderBy: {
        designation: 'asc',
      },
    });

    return products.map((product) => ({
      id: product.id,
      designation: product.designation,
      ref: product.ref,
      bcItem: product.bcItem
        ? {
            id: product.bcItem.id,
            bcId: product.bcItem.bcId,
            number: product.bcItem.number,
            displayName: product.bcItem.displayName,
            baseUnitOfMeasure: product.bcItem.baseUnitOfMeasure,
          }
        : null,
    }));
  }

  /**
   * Récupère et met à jour le statut BC d'un bon de commande
   */
  async refreshBCStatus(id: number): Promise<{ bcStatus: string | null; bcFullyShipped: boolean | null; bcShipmentNumber: string | null; bcInvoiced: boolean | null; bcInvoiceNumber: string | null }> {
    const purchaseOrder = await this.findOne(id);

    if (!purchaseOrder.bcId) {
      throw new BadRequestException('Ce bon de commande n\'a pas encore été envoyé à Business Central');
    }

    const result = await this.bcService.getSalesOrderStatusFromBC(purchaseOrder.bcId, purchaseOrder.bcNumber || undefined);

    if (!result.success) {
      throw new BadRequestException(result.error || 'Erreur lors de la récupération du statut BC');
    }

    // Si le bon de commande est expédié, récupérer les quantités reçues depuis salesShipmentLines
    if (result.fullyShipped && purchaseOrder.bcNumber) {
      const shipmentLinesResult = await this.bcService.getSalesShipmentLines(purchaseOrder.bcNumber);
      
      if (shipmentLinesResult.success && shipmentLinesResult.lines) {
        // Créer un map des quantités par itemId (si disponible)
        const quantitiesByItemId = new Map<string, number>();
        // Créer un map des quantités par lineObjectNumber (numéro d'article)
        const quantitiesByLineObjectNumber = new Map<string, number>();
        
        for (const line of shipmentLinesResult.lines) {
          // Si itemId est disponible, l'utiliser
          if (line.itemId) {
            const currentQty = quantitiesByItemId.get(line.itemId) || 0;
            quantitiesByItemId.set(line.itemId, currentQty + line.quantity);
          }
          // Utiliser lineObjectNumber comme clé principale (car itemId est souvent null)
          if (line.lineObjectNumber) {
            const currentQty = quantitiesByLineObjectNumber.get(line.lineObjectNumber) || 0;
            quantitiesByLineObjectNumber.set(line.lineObjectNumber, currentQty + line.quantity);
          }
        }

        // Mettre à jour les quantités reçues dans les lignes du bon de commande
        // Priorité: lineObjectNumber (numéro d'article) car itemId est souvent null dans BC
        let updatedLinesCount = 0;
        for (const orderLine of purchaseOrder.lines) {
          if (orderLine.product?.bcItem) {
            let receivedQty = 0;
            
            // Essayer d'abord par lineObjectNumber (numéro d'article) - plus fiable
            if (orderLine.product.bcItem.number) {
              receivedQty = quantitiesByLineObjectNumber.get(orderLine.product.bcItem.number) || 0;
            }
            
            // Si pas trouvé par lineObjectNumber, essayer par itemId (bcId)
            if (receivedQty === 0 && orderLine.product.bcItem.bcId) {
              receivedQty = quantitiesByItemId.get(orderLine.product.bcItem.bcId) || 0;
            }
            
            // Toujours mettre à jour la quantité reçue dans la base de données
            // même si elle est identique, pour s'assurer de la synchronisation
            const currentQty = Number(orderLine.qteRecue) || 0;
            if (currentQty !== receivedQty) {
              await this.prisma.purchaseOrderLine.update({
                where: { id: orderLine.id },
                data: { qteRecue: receivedQty },
              });
              updatedLinesCount++;
              // Ne pas créer de log pour les mises à jour automatiques depuis BC
              // car userId 'system' n'existe pas dans la table User
              // Les logs sont déjà enregistrés via this.logger.log
            }
          }
        }
        
        if (updatedLinesCount > 0) {
          this.logger.log(`Mise à jour de ${updatedLinesCount} ligne(s) avec les quantités reçues depuis BC pour le bon de commande ${purchaseOrder.numero}`);
        }
      }
    }

    // Mettre à jour le statut BC dans la base de données
    const updated = await this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        bcStatus: result.status || null,
        bcFullyShipped: result.fullyShipped ?? null,
        bcShipmentNumber: result.shipmentNumber || null,
        bcInvoiced: result.invoiced ?? null,
        bcInvoiceNumber: result.invoiceNumber || null,
        bcLastModified: new Date(),
      },
    });

    // Si le bon de commande est facturé dans BC (bcInvoiced = true)
    // et qu'il n'existe pas encore de facture d'achat, la créer
    if (result.invoiced === true && result.invoiceNumber) {
      const existingInvoice = await this.prisma.purchaseInvoice.findUnique({
        where: { purchaseOrderId: id },
      });

      if (!existingInvoice) {
        this.logger.log(
          `Bon de commande ${purchaseOrder.numero} est facturé dans BC (${result.invoiceNumber}), création automatique de la facture d'achat`,
        );
        try {
          // Récupérer les détails de la facture depuis Business Central
          const invoiceDetails = await this.bcService.getSalesInvoiceDetails(result.invoiceNumber);
          
          // Récupérer les lignes de la facture depuis Business Central
          const invoiceLinesResult = await this.bcService.getSalesInvoiceLines(result.invoiceNumber);
          
          // Récupérer le bon de commande avec toutes les lignes et produits
          const orderWithLines = await this.prisma.purchaseOrder.findUnique({
            where: { id },
            include: {
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

          if (!orderWithLines) {
            throw new Error('Bon de commande non trouvé');
          }

          // Générer un numéro unique pour la facture
          const invoiceNumero = `FA-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

          // Utiliser les montants depuis BC si disponibles, sinon 0
          const montantHT = invoiceDetails.success && invoiceDetails.totalAmountExcludingTax !== undefined
            ? invoiceDetails.totalAmountExcludingTax
            : 0;
          const montantTTCBeforeTimbre = invoiceDetails.success && invoiceDetails.totalAmountIncludingTax !== undefined
            ? invoiceDetails.totalAmountIncludingTax
            : 0;
          const montantTVA = invoiceDetails.success && invoiceDetails.totalTaxAmount !== undefined
            ? invoiceDetails.totalTaxAmount
            : 0;
          
          // Ajouter le timbre fiscal au montant TTC
          const timbreAmount = parseFloat(this.configService.get<string>('TIMBRE') || '1.00');
          const montantTTC = montantTTCBeforeTimbre + timbreAmount;
          
          // Le montant total est le montant TTC (incluant le timbre)
          const montantTotal = montantTTC;

          if (!invoiceDetails.success) {
            this.logger.warn(
              `Impossible de récupérer les montants depuis BC pour la facture ${result.invoiceNumber}: ${invoiceDetails.error}. Les montants seront à 0.`,
            );
          } else {
            this.logger.log(
              `Montants récupérés depuis BC pour la facture ${result.invoiceNumber}: HT=${montantHT}, TTC=${montantTTCBeforeTimbre}, TVA=${montantTVA}. Timbre fiscal ajouté: ${timbreAmount} TND. Nouveau TTC: ${montantTTC}`,
            );
          }

          // Type pour les lignes BC
          type BCLineType = {
            itemId?: string;
            itemNumber?: string;
            unitOfMeasureCode?: string;
            unitPrice?: number;
            quantity?: number;
            discountAmount?: number;
            discountPercent?: number;
            amountExcludingTax?: number;
            totalTaxAmount?: number;
            taxPercent?: number;
            amountIncludingTax?: number;
            netAmount?: number;
            netTaxAmount?: number;
            netAmountIncludingTax?: number;
            shipmentDate?: string;
          };

          // Créer un map des lignes BC par itemNumber et itemId pour faciliter le matching
          const bcLinesByItemNumber = new Map<string, BCLineType>();
          const bcLinesByItemId = new Map<string, BCLineType>();
          
          if (invoiceLinesResult.success && invoiceLinesResult.lines) {
            this.logger.log(
              `Récupération de ${invoiceLinesResult.lines.length} ligne(s) depuis BC pour la facture ${result.invoiceNumber}`,
            );
            for (const bcLine of invoiceLinesResult.lines) {
              this.logger.debug(
                `Ligne BC: itemNumber=${bcLine.itemNumber}, itemId=${bcLine.itemId}, quantity=${bcLine.quantity}, unitPrice=${bcLine.unitPrice}`,
              );
              if (bcLine.itemNumber) {
                bcLinesByItemNumber.set(bcLine.itemNumber, bcLine);
                this.logger.debug(`Ligne BC mappée par itemNumber: ${bcLine.itemNumber}`);
              }
              if (bcLine.itemId) {
                bcLinesByItemId.set(bcLine.itemId, bcLine);
                this.logger.debug(`Ligne BC mappée par itemId: ${bcLine.itemId}`);
              }
            }
            this.logger.log(
              `Maps créés: ${bcLinesByItemNumber.size} entrée(s) par itemNumber, ${bcLinesByItemId.size} entrée(s) par itemId`,
            );
          } else {
            this.logger.warn(
              `Impossible de récupérer les lignes depuis BC pour la facture ${result.invoiceNumber}: ${invoiceLinesResult.error || 'Erreur inconnue'}`,
            );
          }

          // Mapper les lignes du bon de commande avec les lignes BC
          const invoiceLines = orderWithLines.lines.map((orderLine, index) => {
            let bcLine: BCLineType | undefined = undefined;
            
            this.logger.debug(
              `Traitement ligne ${index + 1}/${orderWithLines.lines.length}: produitId=${orderLine.productId}, bcItem.number=${orderLine.product?.bcItem?.number}, bcItem.bcId=${orderLine.product?.bcItem?.bcId}`,
            );
            
            // Essayer de trouver la ligne BC correspondante
            if (orderLine.product?.bcItem?.number) {
              bcLine = bcLinesByItemNumber.get(orderLine.product.bcItem.number);
              if (bcLine) {
                this.logger.log(
                  `✓ Ligne BC trouvée par itemNumber "${orderLine.product.bcItem.number}" pour produit ${orderLine.productId}`,
                );
              } else {
                this.logger.debug(
                  `✗ Aucune ligne BC trouvée par itemNumber "${orderLine.product.bcItem.number}" (clés disponibles: ${Array.from(bcLinesByItemNumber.keys()).join(', ')})`,
                );
              }
            }
            if (!bcLine && orderLine.product?.bcItem?.bcId) {
              bcLine = bcLinesByItemId.get(orderLine.product.bcItem.bcId);
              if (bcLine) {
                this.logger.log(
                  `✓ Ligne BC trouvée par itemId "${orderLine.product.bcItem.bcId}" pour produit ${orderLine.productId}`,
                );
              } else {
                this.logger.debug(
                  `✗ Aucune ligne BC trouvée par itemId "${orderLine.product.bcItem.bcId}" (clés disponibles: ${Array.from(bcLinesByItemId.keys()).join(', ')})`,
                );
              }
            }

            if (!bcLine) {
              this.logger.warn(
                `⚠ Aucune ligne BC trouvée pour le produit ${orderLine.product?.bcItem?.number || orderLine.product?.bcItem?.bcId || orderLine.productId}. Les données du bon de commande seront utilisées.`,
              );
            }

            // Utiliser les données BC si disponibles, sinon les données du bon de commande
            const qte = bcLine?.quantity !== undefined 
              ? bcLine.quantity 
              : (Number(orderLine.qteRecue) > 0 ? Number(orderLine.qteRecue) : Number(orderLine.qte));
            
            const prixUnitaire = bcLine?.unitPrice !== undefined ? bcLine.unitPrice : 0;
            const montant = bcLine?.amountIncludingTax !== undefined 
              ? bcLine.amountIncludingTax 
              : (bcLine?.netAmountIncludingTax !== undefined 
                ? bcLine.netAmountIncludingTax 
                : (prixUnitaire * qte));

            // Helper pour convertir undefined en null (Prisma n'accepte pas undefined)
            const toNull = <T>(value: T | undefined | null): T | null => {
              return value !== undefined ? value : null;
            };

            const lineData = {
              productId: orderLine.productId,
              qte,
              prixUnitaire: prixUnitaire > 0 ? prixUnitaire : null,
              montant,
              // Champs BC - s'assurer que undefined devient null
              unite: toNull(bcLine?.unitOfMeasureCode),
              discountAmount: toNull(bcLine?.discountAmount),
              discountPercent: toNull(bcLine?.discountPercent),
              amountExcludingTax: toNull(bcLine?.amountExcludingTax),
              totalTaxAmount: toNull(bcLine?.totalTaxAmount),
              taxPercent: toNull(bcLine?.taxPercent),
              amountIncludingTax: toNull(bcLine?.amountIncludingTax),
              netAmount: toNull(bcLine?.netAmount),
              netTaxAmount: toNull(bcLine?.netTaxAmount),
              netAmountIncludingTax: toNull(bcLine?.netAmountIncludingTax),
              shipmentDate: bcLine?.shipmentDate ? new Date(bcLine.shipmentDate) : null,
            };

            if (bcLine) {
              this.logger.log(
                `✓ Ligne facture créée avec données BC pour produit ${orderLine.productId}: unite=${lineData.unite}, prixUnitaire=${lineData.prixUnitaire}, qte=${lineData.qte}, montantHT=${lineData.amountExcludingTax}, montantTTC=${lineData.amountIncludingTax}, discountAmount=${lineData.discountAmount}, discountPercent=${lineData.discountPercent}`,
              );
            } else {
              this.logger.debug(
                `Ligne facture créée SANS données BC pour produit ${orderLine.productId}: unite=${lineData.unite}, prixUnitaire=${lineData.prixUnitaire}`,
              );
            }

            return lineData;
          });

          // Log des données avant création pour débogage
          this.logger.debug(
            `Création de la facture d'achat ${invoiceNumero} avec ${invoiceLines.length} ligne(s). Première ligne: ${JSON.stringify(invoiceLines[0] || {})}`,
          );

          const createdInvoice = await this.prisma.purchaseInvoice.create({
            data: {
              numero: invoiceNumero,
              purchaseOrderId: id,
              salespersonId: purchaseOrder.salespersonId,
              status: 'valide',
              montantTotal,
              montantHT: montantHT > 0 ? montantHT : null,
              montantTTC: montantTTC > 0 ? montantTTC : null,
              montantTVA: montantTVA > 0 ? montantTVA : null,
              lines: {
                create: invoiceLines,
              },
            },
            include: {
              lines: true,
            },
          });

          this.logger.log(
            `Facture d'achat ${invoiceNumero} créée automatiquement pour le bon de commande ${purchaseOrder.numero} avec montants HT=${montantHT}, TTC=${montantTTC}, TVA=${montantTVA} et ${invoiceLines.length} ligne(s)`,
          );

          // Vérifier que les données ont bien été enregistrées
          if (createdInvoice.lines && createdInvoice.lines.length > 0) {
            const firstLine = createdInvoice.lines[0];
            this.logger.debug(
              `Première ligne enregistrée: unite=${firstLine.unite}, discountAmount=${firstLine.discountAmount}, amountExcludingTax=${firstLine.amountExcludingTax}`,
            );
          }
        } catch (error: any) {
          this.logger.error(
            `Erreur lors de la création automatique de la facture d'achat pour le bon de commande ${purchaseOrder.numero}: ${error.message}`,
          );
          // Ne pas faire échouer refreshBCStatus si la création de la facture échoue
        }
      } else {
        this.logger.debug(
          `Facture d'achat existe déjà pour le bon de commande ${purchaseOrder.numero}`,
        );
      }
    }

    // Si le bon de commande est expédié dans BC (fullyShipped = true) 
    // et que le statut local est encore "envoye_bc", 
    // marquer automatiquement comme expédié et alimenter le stock
    if (result.fullyShipped === true && purchaseOrder.status === 'envoye_bc') {
      this.logger.log(
        `Bon de commande ${purchaseOrder.numero} est expédié dans BC, marquage automatique comme expédié et alimentation du stock`,
      );
      try {
        // Utiliser le validatedById ou createdById comme userId pour les logs
        const userIdForLog = purchaseOrder.validatedById || purchaseOrder.createdById;
        await this.markAsExpedie(id, userIdForLog);
      } catch (error: any) {
        this.logger.error(
          `Erreur lors du marquage automatique comme expédié pour le bon de commande ${purchaseOrder.numero}: ${error.message}`,
        );
        // Ne pas faire échouer refreshBCStatus si markAsExpedie échoue
        // L'utilisateur pourra toujours marquer manuellement comme expédié
      }
    }

    return { 
      bcStatus: updated.bcStatus,
      bcFullyShipped: updated.bcFullyShipped,
      bcShipmentNumber: updated.bcShipmentNumber,
      bcInvoiced: updated.bcInvoiced,
      bcInvoiceNumber: updated.bcInvoiceNumber,
    };
  }
}

