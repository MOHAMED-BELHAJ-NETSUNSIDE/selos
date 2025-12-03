import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { GetItemsDto } from './dto/get-items.dto';
import { BCItem } from './dto/bc-item.dto';

@Injectable()
export class BCItemsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Convertit la valeur blocked de Business Central en booléen
   * Business Central peut renvoyer "_x0020_" (espace encodé) pour "non bloqué"
   */
  private normalizeBlocked(value: any): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (value === null || value === undefined) {
      return false;
    }
    if (typeof value === 'string') {
      // "_x0020_" est un espace encodé, signifie "non bloqué"
      if (value === '_x0020_' || value.trim() === '') {
        return false;
      }
      // Toute autre chaîne non vide signifie "bloqué"
      return true;
    }
    // Pour les autres types, considérer comme non bloqué
    return false;
  }

  async findAll(query: GetItemsDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search } },
        { number: { contains: query.search } },
      ];
    }

    const items = await this.prisma.bCItem.findMany({
      where,
      orderBy: { displayName: 'asc' },
    });

    return {
      success: true,
      data: items,
      count: items.length,
    };
  }

  async findOne(id: number) {
    const item = await this.prisma.bCItem.findUnique({
      where: { id },
    });

    if (!item) {
      throw new NotFoundException('Item not found');
    }

    return item;
  }

  /**
   * Extrait baseUnitOfMeasure depuis l'item ou depuis rawJson si disponible
   */
  private extractBaseUnitOfMeasure(item: BCItem, rawJson?: any): string | null {
    // Essayer d'abord depuis item.baseUnitOfMeasure
    if (item.baseUnitOfMeasure) {
      return item.baseUnitOfMeasure;
    }

    // Si rawJson est disponible, essayer plusieurs variantes possibles
    if (rawJson) {
      // Essayer baseUnitOfMeasure directement
      if (rawJson.baseUnitOfMeasure) {
        return rawJson.baseUnitOfMeasure;
      }
      // Essayer unitOfMeasure
      if (rawJson.unitOfMeasure) {
        return rawJson.unitOfMeasure;
      }
      // Essayer unitOfMeasureCode
      if (rawJson.unitOfMeasureCode) {
        return rawJson.unitOfMeasureCode;
      }
      // Essayer baseUnitOfMeasureCode
      if (rawJson.baseUnitOfMeasureCode) {
        return rawJson.baseUnitOfMeasureCode;
      }
    }

    return null;
  }

  /**
   * Met à jour les items existants qui ont baseUnitOfMeasure = null
   * en extrayant la valeur depuis rawJson
   */
  async updateMissingBaseUnitOfMeasure() {
    const items = await this.prisma.bCItem.findMany({
      where: {
        baseUnitOfMeasure: null,
        rawJson: {
          not: null as any,
        },
      },
    });

    let updatedCount = 0;
    const logs: string[] = [];

    for (const item of items) {
      try {
        const rawJson = item.rawJson as any;
        if (!rawJson) continue;

        // Extraire baseUnitOfMeasure depuis rawJson
        let baseUnitOfMeasure: string | null = null;
        
        if (rawJson.baseUnitOfMeasure) {
          baseUnitOfMeasure = rawJson.baseUnitOfMeasure;
        } else if (rawJson.unitOfMeasure) {
          baseUnitOfMeasure = rawJson.unitOfMeasure;
        } else if (rawJson.unitOfMeasureCode) {
          baseUnitOfMeasure = rawJson.unitOfMeasureCode;
        } else if (rawJson.baseUnitOfMeasureCode) {
          baseUnitOfMeasure = rawJson.baseUnitOfMeasureCode;
        }

        if (baseUnitOfMeasure) {
          await this.prisma.bCItem.update({
            where: { id: item.id },
            data: { baseUnitOfMeasure },
          });
          updatedCount++;
          
          if (updatedCount % 100 === 0) {
            logs.push(`Updated ${updatedCount} items`);
          }
        }
      } catch (error) {
        console.error(`Error updating item ${item.id}:`, error);
        logs.push(`Error updating item ${item.id}: ${error}`);
      }
    }

    logs.push(`Done. Total items updated: ${updatedCount} out of ${items.length}`);

    return {
      success: true,
      updatedCount,
      totalChecked: items.length,
      logs,
    };
  }

  async syncItems(items: BCItem[]) {
    let count = 0;
    const logs: string[] = [];

    for (const item of items) {
      try {
        const blockedValue = this.normalizeBlocked(item.blocked);
        
        // Extraire baseUnitOfMeasure avec fallback depuis rawJson
        const baseUnitOfMeasure = this.extractBaseUnitOfMeasure(item, item as any);
        
        await this.prisma.bCItem.upsert({
          where: { bcId: item.id },
          update: {
            number: item.number || null,
            displayName: item.displayName || null,
            type: item.type || null,
            itemCategoryCode: item.itemCategoryCode || null,
            itemCategoryId: item.itemCategoryId || null,
            baseUnitOfMeasure: baseUnitOfMeasure,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            unitCost: item.unitCost ? Number(item.unitCost) : null,
            inventory: item.inventory ? Number(item.inventory) : null,
            blocked: blockedValue,
            gtin: item.gtin || null,
            lastModified: item.lastModifiedDateTime 
              ? new Date(item.lastModifiedDateTime) 
              : null,
            etag: item['@odata.etag'] || null,
            rawJson: item as any,
          },
          create: {
            bcId: item.id,
            number: item.number || null,
            displayName: item.displayName || null,
            type: item.type || null,
            itemCategoryCode: item.itemCategoryCode || null,
            itemCategoryId: item.itemCategoryId || null,
            baseUnitOfMeasure: baseUnitOfMeasure,
            unitPrice: item.unitPrice ? Number(item.unitPrice) : null,
            unitCost: item.unitCost ? Number(item.unitCost) : null,
            inventory: item.inventory ? Number(item.inventory) : null,
            blocked: blockedValue,
            gtin: item.gtin || null,
            lastModified: item.lastModifiedDateTime 
              ? new Date(item.lastModifiedDateTime) 
              : null,
            etag: item['@odata.etag'] || null,
            rawJson: item as any,
          },
        });

        count++;

        if (count % 500 === 0) {
          logs.push(`Committed batch: ${count}`);
        }
      } catch (error) {
        console.error('Error processing item:', error);
        logs.push(`Error processing item ${item.id}: ${error}`);
      }
    }

    logs.push(`Done. Total items synced: ${count}`);

    return {
      success: true,
      count,
      logs,
    };
  }
}

