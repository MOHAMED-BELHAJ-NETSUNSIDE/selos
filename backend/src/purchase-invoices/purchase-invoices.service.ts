import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { QueryPurchaseInvoiceDto } from './dto/query-purchase-invoice.dto';

@Injectable()
export class PurchaseInvoicesService {
  constructor(private prisma: PrismaService) {}

  /**
   * Récupère toutes les factures d'achat avec pagination et filtres
   */
  async findAll(query: QueryPurchaseInvoiceDto) {
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
      this.prisma.purchaseInvoice.findMany({
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
      this.prisma.purchaseInvoice.count({ where }),
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
   * Récupère une facture d'achat par ID
   */
  async findOne(id: number) {
    const invoice = await this.prisma.purchaseInvoice.findUnique({
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
      throw new NotFoundException(`Facture d'achat avec l'ID ${id} non trouvée`);
    }

    return invoice;
  }
}

