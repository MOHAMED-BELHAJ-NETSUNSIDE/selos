import { Injectable, NotFoundException, BadRequestException, ConflictException, ForbiddenException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessCentralService } from '../business-central/business-central.service';
import { QueryReturnInvoiceDto } from './dto/query-return-invoice.dto';
import { CreateReturnInvoiceDto } from './dto/create-return-invoice.dto';

@Injectable()
export class ReturnInvoicesService {
  private readonly logger = new Logger(ReturnInvoicesService.name);

  constructor(
    private prisma: PrismaService,
    private bcService: BusinessCentralService,
    private configService: ConfigService,
  ) {}

  /**
   * Récupère toutes les factures de retour avec pagination et filtres
   */
  async findAll(query: QueryReturnInvoiceDto) {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Filtre par vendeur
    if (query.salespersonId) {
      where.salespersonId = query.salespersonId;
    }

    // Filtre par bon de commande
    if (query.purchaseOrderId) {
      where.purchaseOrderId = query.purchaseOrderId;
    }

    // Filtre par statut
    if (query.status) {
      where.status = query.status;
    }

    // Recherche par numéro
    if (query.search) {
      where.numero = {
        contains: query.search,
      };
    }

    // Filtre par plage de dates
    if (query.dateFrom || query.dateTo) {
      where.dateFacture = {};
      if (query.dateFrom) {
        where.dateFacture.gte = new Date(query.dateFrom);
      }
      if (query.dateTo) {
        // Ajouter 23h59m59s pour inclure toute la journée
        const dateTo = new Date(query.dateTo);
        dateTo.setHours(23, 59, 59, 999);
        where.dateFacture.lte = dateTo;
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.returnInvoice.findMany({
        where,
        skip,
        take: limit,
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
          purchaseOrder: {
            select: {
              id: true,
              numero: true,
              status: true,
              bcNumber: true,
              bcInvoiceNumber: true,
            },
          },
          lines: {
            include: {
              product: {
                include: {
                  bcItem: {
                    select: {
                      id: true,
                      bcId: true,
                      number: true,
                      displayName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          dateFacture: 'desc',
        },
      }),
      this.prisma.returnInvoice.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Récupère une facture de retour par ID
   */
  async findOne(id: number) {
    const invoice = await this.prisma.returnInvoice.findUnique({
      where: { id },
      include: {
        salesperson: {
          select: {
            id: true,
            code: true,
            firstName: true,
            lastName: true,
            depotName: true,
            statut: true,
          },
        },
        purchaseOrder: {
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
        },
        lines: {
          include: {
            product: {
              include: {
                bcItem: {
                  select: {
                    id: true,
                    bcId: true,
                    number: true,
                    displayName: true,
                    baseUnitOfMeasure: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException(`Facture de retour avec l'ID ${id} non trouvée`);
    }

    return invoice;
  }

  /**
   * Crée une facture de retour avec des produits et quantités
   */
  async create(createDto: CreateReturnInvoiceDto) {
    // Vérifier que le vendeur existe
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: createDto.salespersonId },
    });

    if (!salesperson) {
      throw new NotFoundException(`Vendeur avec l'ID ${createDto.salespersonId} non trouvé`);
    }

    // Si un bon de commande est fourni, vérifier qu'il existe et qu'il n'y a pas déjà une facture de retour
    if (createDto.purchaseOrderId) {
      const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
        where: { id: createDto.purchaseOrderId },
      });

      if (!purchaseOrder) {
        throw new NotFoundException(`Bon de commande avec l'ID ${createDto.purchaseOrderId} non trouvé`);
      }

      const existingReturnInvoice = await this.prisma.returnInvoice.findUnique({
        where: { purchaseOrderId: createDto.purchaseOrderId },
      });

      if (existingReturnInvoice) {
        throw new ConflictException(`Une facture de retour existe déjà pour le bon de commande ${purchaseOrder.numero}`);
      }
    }

    // Vérifier que tous les produits existent et récupérer leurs informations
    const productIds = createDto.lines.map((line) => line.productId);
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      include: {
        bcItem: true,
      },
    });

    if (products.length !== productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = productIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`Produits non trouvés: ${missingIds.join(', ')}`);
    }

    // Générer un numéro unique pour la facture de retour
    const invoiceNumero = `FR-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

    // Créer les lignes de la facture de retour
    const invoiceLines = await Promise.all(
      createDto.lines.map(async (lineDto) => {
        const product = products.find((p) => p.id === lineDto.productId);
        if (!product) {
          throw new NotFoundException(`Produit avec l'ID ${lineDto.productId} non trouvé`);
        }

        const qte = Number(lineDto.qte);
        let prixUnitaire = lineDto.prixUnitaire ? Number(lineDto.prixUnitaire) : 0;

        // Si le prix n'est pas fourni, récupérer le dernier prix d'achat depuis les factures d'achat validées
        if (prixUnitaire === 0 && createDto.salespersonId) {
          const lastInvoiceLine = await this.prisma.purchaseInvoiceLine.findFirst({
            where: {
              productId: lineDto.productId,
              purchaseInvoice: {
                salespersonId: createDto.salespersonId,
                status: 'valide',
              },
            },
            orderBy: {
              purchaseInvoice: {
                dateFacture: 'desc',
              },
            },
          });

          if (lastInvoiceLine?.prixUnitaire) {
            prixUnitaire = Number(lastInvoiceLine.prixUnitaire);
          }
        }

        const montant = prixUnitaire * qte;

        return {
          productId: lineDto.productId,
          qte,
          prixUnitaire: prixUnitaire > 0 ? prixUnitaire : null,
          montant,
          unite: product.bcItem?.baseUnitOfMeasure || null,
          discountAmount: null,
          discountPercent: null,
          amountExcludingTax: null,
          totalTaxAmount: null,
          taxPercent: null,
          amountIncludingTax: null,
          netAmount: null,
          netTaxAmount: null,
          netAmountIncludingTax: null,
          shipmentDate: null,
        };
      })
    );

    // Calculer le montant total à partir des lignes
    const montantTotalAvantTimbre = invoiceLines.reduce((sum, line) => sum + Number(line.montant), 0);
    
    // Ajouter le timbre fiscal au montant total
    const timbreEnvValue = this.configService.get<string>('TIMBRE');
    const timbreAmount = timbreEnvValue ? parseFloat(timbreEnvValue) : 1.00;
    const montantTotal = montantTotalAvantTimbre + timbreAmount;

    this.logger.log(
      `[ReturnInvoice] Montant total avant timbre: ${montantTotalAvantTimbre} TND. Timbre fiscal (TIMBRE=${timbreEnvValue || 'non défini'}): ${timbreAmount} TND. Montant total final: ${montantTotal} TND`,
    );

    // Créer la facture de retour
    const createdInvoice = await this.prisma.returnInvoice.create({
      data: {
        numero: invoiceNumero,
        purchaseOrderId: createDto.purchaseOrderId || null,
        salespersonId: createDto.salespersonId,
        status: 'cree', // Statut initial : créée
        montantTotal,
        montantHT: null,
        montantTTC: null,
        montantTVA: null,
        lines: {
          create: invoiceLines,
        },
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
        purchaseOrder: {
          select: {
            id: true,
            numero: true,
            status: true,
            bcNumber: true,
            bcInvoiceNumber: true,
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
      },
    });

    this.logger.log(
      `Facture de retour ${invoiceNumero} créée avec ${invoiceLines.length} ligne(s)`,
    );

    return createdInvoice;
  }

  /**
   * Valide une facture de retour, la crée sur BC et décrémente le stock (sortie)
   */
  async validate(id: number, userId: string) {
    const returnInvoice = await this.findOne(id);

    // Vérifier que la facture de retour est en statut "cree"
    if (returnInvoice.status !== 'cree') {
      throw new BadRequestException(
        `Impossible de valider une facture de retour avec le statut "${returnInvoice.status}". Seules les factures avec le statut "cree" peuvent être validées.`,
      );
    }

    // Récupérer les informations du vendeur (client BC)
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: returnInvoice.salespersonId },
      include: {
        bcCustomer: true,
      },
    });

    if (!salesperson) {
      throw new NotFoundException(`Vendeur avec l'ID ${returnInvoice.salespersonId} non trouvé`);
    }

    if (!salesperson.bcCustomer || !salesperson.bcCustomer.number) {
      throw new BadRequestException(
        `Le vendeur ${salesperson.firstName} ${salesperson.lastName} n'a pas de numéro client Business Central associé`,
      );
    }

    // Créer la facture de retour sur Business Central
    let bcResult: { success: boolean; bcId?: string; bcNumber?: string; bcEtag?: string; error?: string } = {
      success: false,
      error: 'Non tenté',
    };

    try {
      const lines = returnInvoice.lines.map((line) => {
        if (!line.product.bcItem) {
          throw new BadRequestException(
            `Le produit ${line.product.designation} n'a pas de BCItem associé`,
          );
        }
        if (!line.product.bcItem.bcId) {
          throw new BadRequestException(
            `Le produit ${line.product.designation} n'a pas de bcId Business Central associé`,
          );
        }
        return {
          itemBCId: line.product.bcItem.bcId, // Utiliser bcId (String) et non id (Int)
          itemNumber: line.product.bcItem.number || undefined,
          quantity: Number(line.qte),
          unitPrice: line.prixUnitaire ? Number(line.prixUnitaire) : undefined,
        };
      });

      bcResult = await this.bcService.createSalesCreditMemoOnBC({
        customerNumber: salesperson.bcCustomer.number,
        postingDate: returnInvoice.dateFacture.toISOString().split('T')[0],
        currencyCode: 'TND',
        lines,
      });

      if (!bcResult.success) {
        this.logger.error(
          `Échec de la création de la facture de retour sur BC: ${bcResult.error}`,
        );
        // On continue quand même pour mettre à jour le statut et le stock localement
      } else {
        this.logger.log(
          `Facture de retour ${returnInvoice.numero} créée sur BC avec le numéro ${bcResult.bcNumber}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Erreur lors de la création de la facture de retour sur BC: ${error.message}`,
      );
      bcResult = {
        success: false,
        error: error.message || 'Erreur inconnue',
      };
    }

    // Mettre à jour le statut et les informations BC
    const updatedInvoice = await this.prisma.returnInvoice.update({
      where: { id },
      data: {
        status: 'valide',
        bcId: bcResult.bcId || null,
        bcNumber: bcResult.bcNumber || null,
        bcEtag: bcResult.bcEtag || null,
        bcLastModified: bcResult.success ? new Date() : null,
        bcSyncError: bcResult.success ? null : (bcResult.error || 'Erreur inconnue'),
      },
      include: {
        salesperson: true,
        purchaseOrder: true,
        lines: {
          include: {
            product: true,
          },
        },
      },
    });

    // Décrémenter le stock pour chaque ligne (sortie de stock)
    let stockUpdatedCount = 0;
    for (const line of updatedInvoice.lines) {
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
            salespersonId: returnInvoice.salespersonId,
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
              salespersonId: returnInvoice.salespersonId,
            },
          },
          data: {
            totalStock: newStock,
          },
        });

        this.logger.log(
          `Stock décrémenté - Produit ${line.productId}, Vendeur ${returnInvoice.salespersonId}: ${currentStock} → ${newStock} (-${qte})`,
        );
        stockUpdatedCount++;
      } else {
        this.logger.warn(
          `Stock non trouvé pour Produit ${line.productId}, Vendeur ${returnInvoice.salespersonId}`,
        );
      }

      // Créer une StockTransaction de type "sortie"
      const transaction = await this.prisma.stockTransaction.create({
        data: {
          productId: line.productId,
          salespersonId: returnInvoice.salespersonId,
          type: 'sortie',
          qte: qte,
          returnInvoiceId: id,
          reference: returnInvoice.numero,
        },
      });

      this.logger.log(
        `Transaction créée - ID: ${transaction.id}, Produit ${line.productId}, Vendeur ${returnInvoice.salespersonId}, Quantité: ${qte}`,
      );
    }

    this.logger.log(
      `Validation terminée pour la facture de retour ${returnInvoice.numero}: ${stockUpdatedCount} produits mis à jour, BC: ${bcResult.success ? 'OK' : 'Échec'}`,
    );

    return updatedInvoice;
  }

  /**
   * Supprime une facture de retour (uniquement si le statut est "cree")
   */
  async remove(id: number) {
    const returnInvoice = await this.prisma.returnInvoice.findUnique({
      where: { id },
    });

    if (!returnInvoice) {
      throw new NotFoundException(`Facture de retour avec l'ID ${id} non trouvée`);
    }

    // Vérifier que la facture peut être supprimée (statut "cree" uniquement)
    if (returnInvoice.status !== 'cree') {
      throw new ForbiddenException(
        `Impossible de supprimer une facture de retour avec le statut "${returnInvoice.status}". Seules les factures avec le statut "cree" peuvent être supprimées.`
      );
    }

    // Supprimer la facture de retour (les lignes seront supprimées automatiquement grâce à onDelete: Cascade)
    await this.prisma.returnInvoice.delete({
      where: { id },
    });

    this.logger.log(`Facture de retour ${returnInvoice.numero} supprimée avec succès`);

    return { message: 'Facture de retour supprimée avec succès' };
  }
}

