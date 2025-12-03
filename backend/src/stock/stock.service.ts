import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BusinessCentralService } from '../business-central/business-central.service';
import { GetStockConsultationDto } from './dto/get-stock-consultation.dto';
import { StockConsultationResponseDto } from './dto/stock-consultation-response.dto';
import { GetStockTransactionsDto } from './dto/get-stock-transactions.dto';
import { StockTransactionsResponseDto } from './dto/stock-transactions-response.dto';
import { GetStockByLocationDto } from './dto/get-stock-by-location.dto';

@Injectable()
export class StockService {
  private readonly logger = new Logger(StockService.name);

  constructor(
    private prisma: PrismaService,
    private bcService: BusinessCentralService,
  ) {}

  async getStockConsultation(
    query: GetStockConsultationDto,
    currentUser?: any,
  ): Promise<StockConsultationResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // Construire les conditions WHERE
    const where: any = {};

    // Si l'utilisateur est un vendeur (salesperson), filtrer automatiquement par son ID
    if (currentUser?.salesperson?.id) {
      where.salespersonId = currentUser.salesperson.id;
    } else if (query.salespersonId) {
      where.salespersonId = query.salespersonId;
    }

    // Filtre par produit
    if (query.productId) {
      where.productId = query.productId;
    }

    // Filtre par quantité
    if (query.minQuantity !== undefined || query.maxQuantity !== undefined) {
      where.totalStock = {};
      if (query.minQuantity !== undefined) {
        where.totalStock.gte = query.minQuantity;
      }
      if (query.maxQuantity !== undefined) {
        where.totalStock.lte = query.maxQuantity;
      }
    }

    // Construire les conditions de recherche si nécessaire
    let searchOrConditions: any[] = [];

    // Recherche textuelle (item, vendeur, dépôt)
    if (query.search) {
      searchOrConditions = [
        {
          product: {
            designation: { contains: query.search },
          },
        },
        {
          product: {
            ref: { contains: query.search },
          },
        },
        {
          product: {
            bcItem: {
              OR: [
                { number: { contains: query.search } },
                { displayName: { contains: query.search } },
              ],
            },
          },
        },
        {
          salesperson: {
            OR: [
              { code: { contains: query.search } },
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { depotName: { contains: query.search } },
            ],
          },
        },
      ];
    }

    // Filtre par BC Item ID
    if (query.bcItemId) {
      where.product = {
        bcItemId: query.bcItemId,
      };
    }

    // Si on a des conditions de recherche, les combiner avec les autres filtres
    if (searchOrConditions.length > 0) {
      const searchConditions = { OR: searchOrConditions };
      
      // Si on a déjà des conditions directes (y compris where.product), les combiner avec AND
      const directConditions: any = {};
      Object.keys(where).forEach(key => {
        if (key !== 'AND') {
          directConditions[key] = where[key];
        }
      });

      if (Object.keys(directConditions).length > 0) {
        where.AND = [
          directConditions,
          searchConditions,
        ];
      } else {
        // Sinon, utiliser directement les conditions de recherche
        Object.assign(where, searchConditions);
      }
    }

    // Compter le total
    const total = await this.prisma.stockTotal.count({ where });

    // Récupérer les données avec les relations
    const stockTotals = await this.prisma.stockTotal.findMany({
      where,
      skip,
      take: limit,
      include: {
        product: {
          include: {
            bcItem: true,
          },
        },
        salesperson: true,
      },
      orderBy: {
        lastUpdated: 'desc',
      },
    });

    // Récupérer les prix d'achat depuis les factures d'achat validées pour chaque produit/vendeur
    // Créer un map pour accéder rapidement aux prix
    const priceMap = new Map<string, number | null>();

    if (stockTotals.length > 0) {
      // Récupérer tous les IDs de produits et vendeurs uniques
      const productIds = [...new Set(stockTotals.map((s) => s.productId))];
      const salespersonIds = [...new Set(stockTotals.map((s) => s.salespersonId))];

      // Récupérer les dernières lignes de facture d'achat pour chaque combinaison produit/vendeur
      const lastInvoiceLines = await this.prisma.purchaseInvoiceLine.findMany({
        where: {
          productId: { in: productIds },
          purchaseInvoice: {
            salespersonId: { in: salespersonIds },
            status: 'valide',
          },
        },
        include: {
          purchaseInvoice: {
            select: {
              dateFacture: true,
              salespersonId: true,
            },
          },
        },
        orderBy: {
          purchaseInvoice: {
            dateFacture: 'desc',
          },
        },
      });

      // Grouper par produit/vendeur et prendre le plus récent pour chaque combinaison
      const latestPrices = new Map<string, { prixUnitaire: number; dateFacture: Date }>();
      lastInvoiceLines.forEach((line) => {
        if (line.prixUnitaire) {
          const key = `${line.productId}-${line.purchaseInvoice.salespersonId}`;
          const existing = latestPrices.get(key);
          if (
            !existing ||
            line.purchaseInvoice.dateFacture > existing.dateFacture
          ) {
            latestPrices.set(key, {
              prixUnitaire: Number(line.prixUnitaire),
              dateFacture: line.purchaseInvoice.dateFacture,
            });
          }
        }
      });

      // Remplir le priceMap
      latestPrices.forEach((price, key) => {
        priceMap.set(key, price.prixUnitaire);
      });
    }

    // Transformer les données pour la réponse
    const data = stockTotals.map((stock) => {
      const priceKey = `${stock.productId}-${stock.salespersonId}`;
      const purchasePrice = priceMap.get(priceKey) || null;

      return {
        id: stock.id,
        product: {
          id: stock.product.id,
          designation: stock.product.designation,
          ref: stock.product.ref,
          bcItem: stock.product.bcItem
            ? {
                id: stock.product.bcItem.id,
                bcId: stock.product.bcItem.bcId,
                number: stock.product.bcItem.number,
                displayName: stock.product.bcItem.displayName,
                baseUnitOfMeasure: stock.product.bcItem.baseUnitOfMeasure,
                unitPrice: stock.product.bcItem.unitPrice ? Number(stock.product.bcItem.unitPrice) : null,
              }
            : null,
        },
        salesperson: {
          id: stock.salesperson.id,
          code: stock.salesperson.code,
          firstName: stock.salesperson.firstName,
          lastName: stock.salesperson.lastName,
          depotName: stock.salesperson.depotName,
          statut: stock.salesperson.statut,
        },
        totalStock: Number(stock.totalStock),
        lastUpdated: stock.lastUpdated,
        purchasePrice, // Prix d'achat depuis les factures d'achat
      };
    });

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async getStockTransactions(
    query: GetStockTransactionsDto,
    currentUser?: any,
  ): Promise<StockTransactionsResponseDto> {
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    // Construire les conditions WHERE
    const where: any = {
      productId: query.productId,
      salespersonId: query.salespersonId,
    };

    // Si l'utilisateur est un vendeur, vérifier qu'il ne peut voir que ses propres transactions
    if (currentUser?.salesperson?.id) {
      if (query.salespersonId !== currentUser.salesperson.id) {
        throw new UnauthorizedException('Vous ne pouvez consulter que vos propres transactions');
      }
    } else if (currentUser?.salespersonId) {
      if (query.salespersonId !== currentUser.salespersonId) {
        throw new UnauthorizedException('Vous ne pouvez consulter que vos propres transactions');
      }
    }

    // Compter le total
    const total = await this.prisma.stockTransaction.count({ where });

    // Récupérer les transactions avec les relations
    const transactions = await this.prisma.stockTransaction.findMany({
      where,
      skip,
      take: limit,
      include: {
        purchaseOrder: {
          select: {
            id: true,
            numero: true,
          },
        },
        deliveryNote: {
          select: {
            id: true,
            numero: true,
          },
        },
        returnInvoice: {
          select: {
            id: true,
            numero: true,
            bcNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transformer les données pour la réponse
    const data = transactions.map((transaction) => ({
      id: transaction.id,
      productId: transaction.productId,
      salespersonId: transaction.salespersonId,
      type: transaction.type,
      qte: Number(transaction.qte),
      purchaseOrderId: transaction.purchaseOrderId,
      deliveryNoteId: transaction.deliveryNoteId,
      returnInvoiceId: transaction.returnInvoiceId,
      reference: transaction.reference,
      createdAt: transaction.createdAt,
      purchaseOrder: transaction.purchaseOrder
        ? {
            id: transaction.purchaseOrder.id,
            numero: transaction.purchaseOrder.numero,
          }
        : null,
      deliveryNote: transaction.deliveryNote
        ? {
            id: transaction.deliveryNote.id,
            numero: transaction.deliveryNote.numero,
          }
        : null,
      returnInvoice: transaction.returnInvoice
        ? {
            id: transaction.returnInvoice.id,
            numero: transaction.returnInvoice.numero,
            bcNumber: transaction.returnInvoice.bcNumber,
          }
        : null,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Récupère le stock des articles groupé par magasin
   * Utilise StockTotal (stock local) lié aux salespersons qui ont un bcLocationId
   * Si pas de stock local pour une location, affiche null
   */
  async getStockByLocation(
    query: GetStockByLocationDto,
  ): Promise<{
    data: Array<{
      id: number;
      bcItem: {
        id: number;
        bcId: string;
        number: string | null;
        displayName: string | null;
        baseUnitOfMeasure: string | null;
        unitPrice: number | null;
        inventory: number | null; // Stock global BC (pour référence)
      };
      location: {
        id: number;
        bcId: string;
        code: string | null;
        displayName: string | null;
        city: string | null;
        country: string | null;
      } | null;
      stockByLocation: number | null; // Stock réel par location depuis StockTotal
      prices: Array<{
        id: number;
        unitPrice: number;
        salesType: string | null;
        salesCode: string | null;
        minimumQuantity: number | null;
        currencyCode: string | null;
      }>;
    }>;
    total: number;
    page: number;
    limit: number;
  }> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    // OBLIGATOIRE : Un article doit être sélectionné pour éviter de surcharger l'API BC
    if (!query.bcItemId && !query.itemNumber) {
      this.logger.warn('getStockByLocation called without bcItemId or itemNumber - returning empty result');
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    // Construire les conditions WHERE pour BCItem
    const where: any = {};

    // Filtre par location (via bcId)
    if (query.locationId) {
      // On va filtrer après avoir récupéré les items, car la relation est indirecte
      // via Salesperson -> bcLocationId
    }

    // Filtre par bcItemId (OBLIGATOIRE)
    if (query.bcItemId) {
      where.bcId = query.bcItemId;
    }

    // Filtre par itemNumber
    if (query.itemNumber) {
      where.number = { contains: query.itemNumber };
    }

    // Recherche textuelle
    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search } },
        { number: { contains: query.search } },
      ];
    }

    // Filtre par quantité (inventory)
    if (query.minQuantity !== undefined || query.maxQuantity !== undefined) {
      where.inventory = {};
      if (query.minQuantity !== undefined) {
        where.inventory.gte = query.minQuantity;
      }
      if (query.maxQuantity !== undefined) {
        where.inventory.lte = query.maxQuantity;
      }
    }

    // Récupérer tous les items BC avec leur inventory
    const bcItems = await this.prisma.bCItem.findMany({
      where,
      include: {
        prices: {
          take: 10, // Limiter à 10 prix par item
          orderBy: [
            { startingDate: 'desc' },
            { minimumQuantity: 'asc' },
          ],
        },
      },
      orderBy: { displayName: 'asc' },
    });

    this.logger.debug(`Found ${bcItems.length} BC items matching filters`);
    
    // Si aucun item trouvé, retourner une réponse vide
    if (bcItems.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
      };
    }

    // Récupérer toutes les locations
    const allLocations = await this.prisma.bCLocation.findMany({
      orderBy: { displayName: 'asc' },
    });

    // Créer un map des locations par bcId
    const locationMap = new Map<string, typeof allLocations[0]>();
    allLocations.forEach((loc) => {
      locationMap.set(loc.bcId, loc);
    });

    // Récupérer les salespersons avec leur location
    const salespersons = await this.prisma.salesperson.findMany({
      where: {
        bcLocationId: { not: null },
      },
      select: {
        id: true,
        bcLocationId: true,
      },
    });

    // Créer un map des salespersons par location
    const salespersonsByLocation = new Map<string, number[]>();
    salespersons.forEach((sp) => {
      if (sp.bcLocationId) {
        if (!salespersonsByLocation.has(sp.bcLocationId)) {
          salespersonsByLocation.set(sp.bcLocationId, []);
        }
        salespersonsByLocation.get(sp.bcLocationId)!.push(sp.id);
      }
    });

    // Si un locationId est spécifié, filtrer les locations
    let filteredLocations = allLocations;
    if (query.locationId) {
      filteredLocations = allLocations.filter((loc) => loc.bcId === query.locationId);
    }

    // Récupérer les produits liés aux BCItems pour pouvoir accéder à StockTotal
    const productIdsByBcItemId = new Map<string, number[]>();
    const products = await this.prisma.product.findMany({
      where: {
        bcItemId: { in: bcItems.map(item => item.bcId) },
      },
      select: {
        id: true,
        bcItemId: true,
      },
    });

    products.forEach((product) => {
      if (product.bcItemId) {
        if (!productIdsByBcItemId.has(product.bcItemId)) {
          productIdsByBcItemId.set(product.bcItemId, []);
        }
        productIdsByBcItemId.get(product.bcItemId)!.push(product.id);
      }
    });

    // Récupérer tous les StockTotal pour les produits et salespersons concernés
    const allProductIds = Array.from(productIdsByBcItemId.values()).flat();
    const allSalespersonIds = Array.from(salespersonsByLocation.values()).flat();
    
    const stockTotals = await this.prisma.stockTotal.findMany({
      where: {
        productId: { in: allProductIds },
        salespersonId: { in: allSalespersonIds },
      },
      include: {
        product: {
          select: {
            id: true,
            bcItemId: true,
          },
        },
        salesperson: {
          select: {
            id: true,
            bcLocationId: true,
          },
        },
      },
    });

    // Créer un map du stock par (productId, salespersonId) puis par (bcItemId, locationId)
    const stockByProductAndSalesperson = new Map<string, number>();
    stockTotals.forEach((stock) => {
      const key = `${stock.productId}-${stock.salespersonId}`;
      stockByProductAndSalesperson.set(key, Number(stock.totalStock));
    });

    // Récupérer le stock réel depuis Business Central pour chaque combinaison item-location
    // Préparer la liste des combinaisons à récupérer
    const itemsToFetch: Array<{ itemNumber: string; locationCode: string; bcItemId: string; locationId: string }> = [];
    const itemLocationMap = new Map<string, { bcItemId: string; locationId: string }>();
    
    for (const location of filteredLocations) {
      for (const bcItem of bcItems) {
        const key = `${bcItem.bcId}-${location.bcId}`;
        // Toujours créer une entrée pour cette combinaison, même si number ou code est null
        itemLocationMap.set(key, {
          bcItemId: bcItem.bcId,
          locationId: location.bcId,
        });
        
        // Seulement ajouter à itemsToFetch si on a les informations nécessaires pour appeler BC
        if (bcItem.number && location.code) {
          itemsToFetch.push({
            itemNumber: bcItem.number,
            locationCode: location.code,
            bcItemId: bcItem.bcId,
            locationId: location.bcId,
          });
        }
      }
    }

    // Récupérer le stock depuis Business Central pour toutes les combinaisons valides
    this.logger.debug(`Fetching stock from BC for ${itemsToFetch.length} item-location combinations`);
    const bcStockMap = new Map<string, number | null>();
    
    if (itemsToFetch.length > 0) {
      const fetchedStock = await this.bcService.getMultipleItemsStockByLocation(
        itemsToFetch.map(item => ({
          itemNumber: item.itemNumber,
          locationCode: item.locationCode,
        }))
      );
      
      // Copier les résultats dans bcStockMap
      fetchedStock.forEach((value, key) => {
        bcStockMap.set(key, value);
      });
    }

    // Créer un map du stock par (bcItemId, locationId) depuis BC
    const stockByItemAndLocation = new Map<string, number | null>();
    itemsToFetch.forEach((item) => {
      const key = `${item.bcItemId}-${item.locationId}`;
      const bcKey = `${item.itemNumber}-${item.locationCode}`;
      const stockFromBC = bcStockMap.get(bcKey);
      stockByItemAndLocation.set(key, stockFromBC !== undefined ? stockFromBC : null);
    });
    
    // Pour les combinaisons qui n'ont pas pu être récupérées depuis BC (pas de number ou code),
    // initialiser avec null
    itemLocationMap.forEach((value, key) => {
      if (!stockByItemAndLocation.has(key)) {
        stockByItemAndLocation.set(key, null);
      }
    });

    // Construire les données de réponse
    // Pour chaque combinaison item-location, récupérer le stock réel depuis BC
    const result: Array<{
      id: number;
      bcItem: any;
      location: any;
      stockByLocation: number | null;
      prices: any[];
    }> = [];

    this.logger.debug(`Building results: ${bcItems.length} items, ${filteredLocations.length} locations`);

    for (const location of filteredLocations) {
      for (const bcItem of bcItems) {
        // Récupérer le stock réel depuis BC pour cette combinaison item-location
        const stockKey = `${bcItem.bcId}-${location.bcId}`;
        const stockForLocation = stockByItemAndLocation.get(stockKey) ?? null;

        // Si un filtre de quantité est spécifié, vérifier si on doit inclure cet item
        // Mais toujours inclure si le stock est null (pour afficher "N/A")
        if (query.minQuantity !== undefined && stockForLocation !== null) {
          if (stockForLocation < query.minQuantity) {
            continue;
          }
        }
        if (query.maxQuantity !== undefined && stockForLocation !== null) {
          if (stockForLocation > query.maxQuantity) {
            continue;
          }
        }

        // Toujours créer une entrée, même si le stock est null
        result.push({
          id: bcItem.id,
          bcItem: {
            id: bcItem.id,
            bcId: bcItem.bcId,
            number: bcItem.number,
            displayName: bcItem.displayName,
            baseUnitOfMeasure: bcItem.baseUnitOfMeasure,
            unitPrice: bcItem.unitPrice ? Number(bcItem.unitPrice) : null,
            inventory: bcItem.inventory ? Number(bcItem.inventory) : null, // Stock global BC (référence)
          },
          location: {
            id: location.id,
            bcId: location.bcId,
            code: location.code,
            displayName: location.displayName,
            city: location.city,
            country: location.country,
          },
          stockByLocation: stockForLocation, // Stock réel par location (peut être null)
          prices: bcItem.prices.map((price) => ({
            id: price.id,
            unitPrice: Number(price.unitPrice),
            salesType: price.salesType,
            salesCode: price.salesCode,
            minimumQuantity: price.minimumQuantity ? Number(price.minimumQuantity) : null,
            currencyCode: price.currencyCode,
          })),
        });
      }
    }

    this.logger.debug(`Total results before pagination: ${result.length}`);

    // Pagination
    const total = result.length;
    const paginatedResult = result.slice(skip, skip + limit);

    this.logger.debug(`Returning ${paginatedResult.length} results (page ${page}, limit ${limit}, total ${total})`);

    return {
      data: paginatedResult,
      total,
      page,
      limit,
    };
  }
}

