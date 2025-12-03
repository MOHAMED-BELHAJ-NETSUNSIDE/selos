import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetPricesDto } from './dto/get-prices.dto';
import { BCItemPrice } from './dto/bc-item-price.dto';

@Injectable()
export class BCItemPricesService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetPricesDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { itemNumber: { contains: query.search } },
        { salesCode: { contains: query.search } },
        { salesCodeName: { contains: query.search } },
      ];
    }

    if (query.itemId) {
      where.itemId = query.itemId;
    }

    if (query.itemNumber) {
      where.itemNumber = query.itemNumber;
    }

    if (query.salesType) {
      where.salesType = query.salesType;
    }

    if (query.salesCode) {
      where.salesCode = query.salesCode;
    }

    const prices = await this.prisma.bCItemPrice.findMany({
      where,
      include: {
        bcItem: {
          select: {
            id: true,
            number: true,
            displayName: true,
          },
        },
      },
      orderBy: [
        { startingDate: 'desc' },
        { minimumQuantity: 'asc' },
      ],
    });

    return {
      success: true,
      data: prices,
      count: prices.length,
    };
  }

  async findOne(id: number) {
    const price = await this.prisma.bCItemPrice.findUnique({
      where: { id },
      include: {
        bcItem: {
          select: {
            id: true,
            number: true,
            displayName: true,
          },
        },
      },
    });

    if (!price) {
      throw new NotFoundException('Price not found');
    }

    return price;
  }

  /**
   * Synchronise les prix depuis Business Central (format itemSalesPrices OData V4)
   */
  async syncPrices(prices: BCItemPrice[]) {
    let count = 0;
    const logs: string[] = [];
    
    // Set pour tracker les prix déjà traités dans ce batch (éviter les doublons dans le même batch)
    const processedInBatch = new Set<string>();
    
    console.log(`[BCItemPricesService] Starting sync of ${prices.length} prices...`);
    
    // Log les premiers prix pour vérifier la structure des données et voir s'il y a plusieurs prix par item
    if (prices.length > 0) {
      console.log(`[BCItemPricesService] Sample price data (first):`, JSON.stringify(prices[0], null, 2));
      
      // Compter combien de prix différents on a par item
      const pricesByItem = new Map<string, number>();
      prices.forEach(p => {
        const itemNo = p.Item_No || 'unknown';
        pricesByItem.set(itemNo, (pricesByItem.get(itemNo) || 0) + 1);
      });
      
      const itemsWithMultiplePrices = Array.from(pricesByItem.entries())
        .filter(([_, count]) => count > 1)
        .map(([itemNo, count]) => ({ itemNo, count }));
      
      if (itemsWithMultiplePrices.length > 0) {
        console.log(`[BCItemPricesService] Found ${itemsWithMultiplePrices.length} items with multiple prices:`, itemsWithMultiplePrices.slice(0, 5));
      }
    }

    for (const price of prices) {
      try {
        const parseDate = (dateStr?: string): Date | null => {
          if (!dateStr || dateStr === '0001-01-01' || dateStr === '') return null;
          const date = new Date(dateStr);
          return isNaN(date.getTime()) ? null : date;
        };

        const parseDecimal = (value?: number | string): number | null => {
          if (value === null || value === undefined) return null;
          // Gérer correctement la valeur 0 (qui est falsy mais valide)
          if (value === 0 || value === '0') return 0;
          const parsed = typeof value === 'string' ? parseFloat(value) : value;
          return isNaN(parsed) ? null : parsed;
        };

        const parseBoolean = (value?: boolean | string): boolean | null => {
          if (value === null || value === undefined) return null;
          if (typeof value === 'boolean') return value;
          if (typeof value === 'string') {
            return value.toLowerCase() === 'true' || value === '1';
          }
          return null;
        };

        // Helper pour normaliser les valeurs pour la comparaison
        const normalizeValue = (value: any): string | number => {
          if (value === null || value === undefined) return '';
          if (typeof value === 'number') return value;
          if (typeof value === 'string') {
            // Normaliser les dates "0001-01-01" à ''
            if (value === '0001-01-01' || value === '') return '';
            return value;
          }
          return String(value);
        };

        // Helper pour normaliser les dates pour la comparaison
        const normalizeDate = (date: Date | null): string => {
          if (!date) return '';
          return date.toISOString().split('T')[0];
        };

        // Utiliser Item_No comme itemId (c'est le numéro de l'item dans BC)
        const itemNumber = price.Item_No || '';
        if (!itemNumber) {
          logs.push(`Skipping price without Item_No`);
          continue;
        }

        // Vérifier si l'item existe dans BCItem (number n'est pas unique, utiliser findFirst)
        const bcItem = await this.prisma.bCItem.findFirst({
          where: { number: itemNumber },
        });

        // Si l'item n'existe pas, on ne peut pas créer le prix car il y a une contrainte de clé étrangère
        // On doit utiliser le bcId de l'item comme itemId
        if (!bcItem) {
          logs.push(`Skipping price for item ${itemNumber}: item not found in BCItem table. Please sync items first.`);
          continue;
        }

        const finalItemId = bcItem.bcId;
        
        // Parser les valeurs avant de les utiliser
        // Business Central peut retourner soit Minimum_Quantity soit quantity
        const parsedStartingDate = parseDate(price.Starting_Date);
        const parsedEndingDate = parseDate(price.Ending_Date);
        // Support à la fois Minimum_Quantity (OData) et quantity (format alternatif)
        const parsedMinimumQuantity = parseDecimal(price.Minimum_Quantity ?? (price as any).quantity);
        const parsedUnitPrice = parseDecimal(price.Unit_Price) || 0;
        
        // Log pour déboguer - afficher les détails des premiers prix
        if (count < 5) {
          console.log(`[BCItemPricesService] Processing price ${count + 1}:`, {
            Item_No: itemNumber,
            bcItem_bcId: finalItemId,
            Unit_Price: price.Unit_Price,
            Parsed_Unit_Price: parsedUnitPrice,
            Sales_Type: price.Sales_Type,
            Sales_Code: price.Sales_Code,
            Starting_Date: price.Starting_Date,
            Ending_Date: price.Ending_Date,
            Minimum_Quantity: price.Minimum_Quantity,
            quantity: (price as any).quantity,
            Parsed_Minimum_Quantity: parsedMinimumQuantity,
            Variant_Code: price.Variant_Code,
            Unit_of_Measure_Code: price.Unit_of_Measure_Code,
            Currency_Code: price.Currency_Code,
            bcId: price.id,
          });
        }

        // Créer une clé unique basée sur TOUTES les conditions de vente
        // Il peut y avoir plusieurs prix pour le même produit avec des conditions différentes
        // On doit inclure tous les champs qui peuvent différencier deux prix
        
        // Stratégie simplifiée : toujours créer un nouveau prix
        // Si un prix identique existe déjà, on le mettra à jour via une contrainte unique ou on gérera l'erreur
        // Cette approche garantit que tous les prix sont stockés
        
        // Créer un hash/identifiant unique basé sur toutes les conditions pour détecter les doublons
        // IMPORTANT: Normaliser toutes les valeurs pour une comparaison fiable
        // Normaliser les dates (convertir "0001-01-01" en '')
        const normalizedStartingDate = price.Starting_Date && price.Starting_Date !== '0001-01-01' ? price.Starting_Date : '';
        const normalizedEndingDate = price.Ending_Date && price.Ending_Date !== '0001-01-01' ? price.Ending_Date : '';
        
        const priceSignature = JSON.stringify({
          itemId: finalItemId,
          unitPrice: parsedUnitPrice,
          salesType: normalizeValue(price.Sales_Type),
          salesCode: normalizeValue(price.Sales_Code),
          startingDate: normalizedStartingDate,
          endingDate: normalizedEndingDate,
          minimumQuantity: parsedMinimumQuantity !== null ? parsedMinimumQuantity : '',
          variantCode: normalizeValue(price.Variant_Code),
          unitOfMeasureCode: normalizeValue(price.Unit_of_Measure_Code),
          currencyCode: normalizeValue(price.Currency_Code),
        });
        
        // Vérifier si ce prix a déjà été traité dans ce batch (éviter les doublons dans le même batch)
        if (processedInBatch.has(priceSignature)) {
          logs.push(`Skipping duplicate price in batch for item ${itemNumber} (already processed)`);
          continue;
        }
        
        // Chercher un prix existant avec exactement les mêmes valeurs
        // On va chercher tous les prix de cet item et comparer manuellement
        const existingPrices = await this.prisma.bCItemPrice.findMany({
          where: { itemId: finalItemId },
        });
        
        // Comparer avec les prix existants en normalisant les valeurs
        let existingPrice: { id: number; [key: string]: any } | null = null;
        for (const existing of existingPrices) {
          const existingSignature = JSON.stringify({
            itemId: existing.itemId,
            unitPrice: Number(existing.unitPrice),
            salesType: normalizeValue(existing.salesType),
            salesCode: normalizeValue(existing.salesCode),
            startingDate: normalizeDate(existing.startingDate),
            endingDate: normalizeDate(existing.endingDate),
            minimumQuantity: existing.minimumQuantity !== null ? Number(existing.minimumQuantity) : '',
            variantCode: normalizeValue(existing.variantCode),
            unitOfMeasureCode: normalizeValue(existing.unitOfMeasureCode),
            currencyCode: normalizeValue(existing.currencyCode),
          });
          
          if (existingSignature === priceSignature) {
            existingPrice = existing;
            break;
          }
        }

        // Si un prix identique existe, le mettre à jour
        // Sinon, créer un nouveau prix
        if (existingPrice) {
          // Log pour déboguer
          if (count < 5) {
            console.log(`[BCItemPricesService] Updating existing price ${existingPrice.id} for item ${itemNumber} (Unit_Price=${parsedUnitPrice})`);
          }
          await this.prisma.bCItemPrice.update({
            where: { id: existingPrice.id },
            data: {
              itemNumber: itemNumber,
              unitPrice: parsedUnitPrice,
              minimumQuantity: parsedMinimumQuantity,
              salesType: price.Sales_Type || null,
              salesCode: price.Sales_Code || null,
              salesCodeName: null,
              startingDate: parsedStartingDate,
              endingDate: parsedEndingDate,
              unitOfMeasureCode: price.Unit_of_Measure_Code || null,
              currencyCode: price.Currency_Code || null,
              variantCode: price.Variant_Code || null,
              priceIncludesVAT: parseBoolean(price.Price_Includes_VAT),
              allowLineDisc: parseBoolean(price.Allow_Line_Disc),
              allowInvoiceDisc: parseBoolean(price.Allow_Invoice_Disc),
              vatBusPostingGr: price.VAT_Bus_Posting_Gr_Price || null,
              lastModified: parseDate(price.lastModifiedDateTime),
              etag: price['@odata.etag'] || null,
              rawJson: price as any,
            },
          });
          // Marquer ce prix comme traité dans ce batch
          processedInBatch.add(priceSignature);
          count++;
        } else {
          // Créer un nouveau prix car les conditions sont différentes
          // Log pour déboguer
          if (count < 5) {
            console.log(`[BCItemPricesService] Creating NEW price #${count + 1} for item ${itemNumber}, Unit_Price=${parsedUnitPrice}, Sales_Type=${price.Sales_Type || 'null'}, Sales_Code=${price.Sales_Code || 'null'}`);
          }
          
          try {
            await this.prisma.bCItemPrice.create({
              data: {
                bcId: price.id || null,
                itemId: finalItemId,
                itemNumber: itemNumber,
                unitPrice: parsedUnitPrice,
                minimumQuantity: parsedMinimumQuantity,
                salesType: price.Sales_Type || null,
                salesCode: price.Sales_Code || null,
                salesCodeName: null,
                startingDate: parsedStartingDate,
                endingDate: parsedEndingDate,
                unitOfMeasureCode: price.Unit_of_Measure_Code || null,
                currencyCode: price.Currency_Code || null,
                variantCode: price.Variant_Code || null,
                priceIncludesVAT: parseBoolean(price.Price_Includes_VAT),
                allowLineDisc: parseBoolean(price.Allow_Line_Disc),
                allowInvoiceDisc: parseBoolean(price.Allow_Invoice_Disc),
                vatBusPostingGr: price.VAT_Bus_Posting_Gr_Price || null,
                lastModified: parseDate(price.lastModifiedDateTime),
                etag: price['@odata.etag'] || null,
                rawJson: price as any,
              },
            });
            // Marquer ce prix comme traité dans ce batch
            processedInBatch.add(priceSignature);
            count++;
          } catch (createError: any) {
            // Si erreur de contrainte unique, essayer de mettre à jour
            if (createError.code === 'P2002' || createError.message?.includes('Unique constraint')) {
              logs.push(`Price already exists for item ${itemNumber}, skipping duplicate`);
              continue;
            }
            throw createError;
          }
        }

        if (count % 500 === 0) {
          logs.push(`Committed batch: ${count}`);
        }
      } catch (error) {
        console.error('Error processing price:', error);
        const errorMessage = error instanceof Error ? error.message : String(error);
        logs.push(`Error processing price ${price.Item_No || 'unknown'}: ${errorMessage}`);
        // Log les détails de l'erreur pour déboguer
        if (error instanceof Error && error.message.includes('Foreign key constraint')) {
          logs.push(`  → Foreign key constraint failed. Item ${price.Item_No} may not exist in BCItem table.`);
        }
      }
    }

    logs.push(`Done. Total prices synced: ${count}`);
    
    // Log final : compter combien de prix différents on a par item dans la base
    const pricesInDb = await this.prisma.bCItemPrice.findMany({
      select: { itemNumber: true },
    });
    
    const pricesByItemInDb = new Map<string, number>();
    pricesInDb.forEach(p => {
      if (p.itemNumber) {
        pricesByItemInDb.set(p.itemNumber, (pricesByItemInDb.get(p.itemNumber) || 0) + 1);
      }
    });
    
    const itemsWithMultiplePricesInDb = Array.from(pricesByItemInDb.entries())
      .filter(([_, count]) => count > 1)
      .map(([itemNo, count]) => ({ itemNo, count }));
    
    if (itemsWithMultiplePricesInDb.length > 0) {
      console.log(`[BCItemPricesService] After sync: ${itemsWithMultiplePricesInDb.length} items have multiple prices in DB:`, itemsWithMultiplePricesInDb.slice(0, 10));
      logs.push(`Items with multiple prices in DB: ${itemsWithMultiplePricesInDb.length}`);
    } else {
      console.log(`[BCItemPricesService] Warning: No items found with multiple prices in DB. This might indicate a problem.`);
      logs.push(`⚠ Warning: No items found with multiple prices in DB`);
    }

    return {
      success: true,
      count,
      logs,
    };
  }

  async findByItemId(itemId: string) {
    return this.prisma.bCItemPrice.findMany({
      where: { itemId },
      orderBy: [
        { startingDate: 'desc' },
        { minimumQuantity: 'asc' },
      ],
    });
  }

  async findByItemNumber(itemNumber: string) {
    return this.prisma.bCItemPrice.findMany({
      where: { itemNumber },
      orderBy: [
        { startingDate: 'desc' },
        { minimumQuantity: 'asc' },
      ],
    });
  }

  async findByBcItemId(bcItemId: string) {
    // Trouver l'item par bcId
    const bcItem = await this.prisma.bCItem.findUnique({
      where: { bcId: bcItemId },
    });

    if (!bcItem) {
      return [];
    }

    // Récupérer les prix par itemId (bcId) ou itemNumber
    return this.prisma.bCItemPrice.findMany({
      where: {
        OR: [
          { itemId: bcItem.bcId },
          { itemNumber: bcItem.number },
        ],
      },
      orderBy: [
        { startingDate: 'desc' },
        { minimumQuantity: 'asc' },
      ],
    });
  }
}

