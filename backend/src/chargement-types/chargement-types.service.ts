import { Injectable, NotFoundException, ConflictException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateChargementTypeDto } from './dto/create-chargement-type.dto';
import { UpdateChargementTypeDto } from './dto/update-chargement-type.dto';
import { PurchaseOrdersService } from '../purchase-orders/purchase-orders.service';

@Injectable()
export class ChargementTypesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => PurchaseOrdersService))
    private purchaseOrdersService: PurchaseOrdersService,
  ) {}

  async create(dto: CreateChargementTypeDto, userId?: string) {
    // Vérifier que le salesperson existe
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: dto.salespersonId },
    });
    if (!salesperson) {
      throw new NotFoundException('Salesperson not found');
    }

    // Vérifier qu'il n'existe pas déjà un chargement type pour ce salesperson
    const existing = await this.prisma.chargementType.findFirst({
      where: { salespersonId: dto.salespersonId },
    });
    if (existing) {
      throw new ConflictException('Un chargement type existe déjà pour ce vendeur');
    }

    // Vérifier que tous les bcId existent
    const bcIds = dto.products.map(p => p.productId);
    const bcItems = await this.prisma.bCItem.findMany({
      where: { bcId: { in: bcIds } },
    });
    
    if (bcItems.length !== bcIds.length) {
      const foundIds = new Set(bcItems.map(item => item.bcId));
      const missingIds = bcIds.filter(id => !foundIds.has(id));
      throw new NotFoundException(`BCItems not found: ${missingIds.join(', ')}`);
    }

    // Utiliser directement les bcId
    const productData = dto.products.map((p) => ({
      productId: p.productId, // bcId directement
      qte: p.qte,
    }));

    // Créer le chargement type avec ses produits
    const created = await this.prisma.chargementType.create({
      data: {
        salespersonId: dto.salespersonId,
        name: dto.name,
        products: {
          create: productData,
        },
      },
      include: {
        salesperson: true,
        products: true,
      },
    });

    // Enrichir les produits avec les informations BCItem (réutiliser les bcItems déjà récupérés)
    const bcItemsMap = new Map(bcItems.map(item => [item.bcId, item]));

    const enriched = {
      ...created,
      products: created.products.map(p => ({
        ...p,
        bcItem: bcItemsMap.get(p.productId) || null,
      })),
    };

    // Créer automatiquement le bon de commande depuis le chargement type
    if (userId) {
      try {
        await this.purchaseOrdersService.createFromChargementType(created.id, userId);
      } catch (error) {
        // Si la création du bon de commande échoue, on log l'erreur mais on retourne quand même le chargement type
        console.error('Erreur lors de la création automatique du bon de commande:', error);
      }
    }

    return enriched;
  }

  async findAll() {
    const chargementTypes = await this.prisma.chargementType.findMany({
      include: {
        salesperson: true,
        products: true,
      },
      orderBy: { id: 'desc' },
    });

    // Enrichir les produits avec les informations BCItem
    const enriched = await Promise.all(
      chargementTypes.map(async (ct) => {
        const bcIds = ct.products.map(p => p.productId);
        const bcItems = await this.prisma.bCItem.findMany({
          where: { bcId: { in: bcIds } },
        });
        const bcItemsMap = new Map(bcItems.map(item => [item.bcId, item]));

        return {
          ...ct,
          products: ct.products.map(p => ({
            ...p,
            bcItem: bcItemsMap.get(p.productId) || null,
          })),
        };
      })
    );

    return enriched;
  }

  async findOne(id: number) {
    const ct = await this.prisma.chargementType.findUnique({
      where: { id },
      include: {
        salesperson: true,
        products: true,
      },
    });
    if (!ct) throw new NotFoundException('Chargement type not found');

    // Enrichir les produits avec les informations BCItem
    const bcIds = ct.products.map(p => p.productId);
    const bcItems = await this.prisma.bCItem.findMany({
      where: { bcId: { in: bcIds } },
    });
    const bcItemsMap = new Map(bcItems.map(item => [item.bcId, item]));

    return {
      ...ct,
      products: ct.products.map(p => ({
        ...p,
        bcItem: bcItemsMap.get(p.productId) || null,
      })),
    };
  }

  async findBySalesperson(salespersonId: number) {
    const ct = await this.prisma.chargementType.findFirst({
      where: { salespersonId },
      include: {
        salesperson: true,
        products: true,
      },
    });
    if (!ct) throw new NotFoundException('Chargement type not found for this salesperson');

    // Enrichir les produits avec les informations BCItem
    const bcIds = ct.products.map(p => p.productId);
    const bcItems = await this.prisma.bCItem.findMany({
      where: { bcId: { in: bcIds } },
    });
    const bcItemsMap = new Map(bcItems.map(item => [item.bcId, item]));

    return {
      ...ct,
      products: ct.products.map(p => ({
        ...p,
        bcItem: bcItemsMap.get(p.productId) || null,
      })),
    };
  }

  async update(id: number, dto: UpdateChargementTypeDto) {
    await this.findOne(id);

    // Si on change le salesperson, vérifier qu'il n'y a pas déjà un chargement type
    if (dto.salespersonId) {
      const existing = await this.prisma.chargementType.findFirst({
        where: {
          salespersonId: dto.salespersonId,
          id: { not: id },
        },
      });
      if (existing) {
        throw new ConflictException('Un chargement type existe déjà pour ce vendeur');
      }
    }

    // Mettre à jour le chargement type
    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.salespersonId !== undefined) updateData.salespersonId = dto.salespersonId;

    // Si des produits sont fournis, remplacer tous les produits
    if (dto.products) {
      // Supprimer les anciens produits
      await this.prisma.chargementTypeProduct.deleteMany({
        where: { chargementTypeId: id },
      });

      // Vérifier que tous les bcId existent
      const validationBcIds = dto.products.map(p => p.productId);
      const validationBcItems = await this.prisma.bCItem.findMany({
        where: { bcId: { in: validationBcIds } },
      });
      
      if (validationBcItems.length !== validationBcIds.length) {
        const foundIds = new Set(validationBcItems.map(item => item.bcId));
        const missingIds = validationBcIds.filter(id => !foundIds.has(id));
        throw new NotFoundException(`BCItems not found: ${missingIds.join(', ')}`);
      }

      // Utiliser directement les bcId
      const productData = dto.products.map((p) => ({
        productId: p.productId, // bcId directement
        qte: p.qte,
      }));

      // Créer les nouveaux produits
      updateData.products = {
        create: productData,
      };
    }

    const updated = await this.prisma.chargementType.update({
      where: { id },
      data: updateData,
      include: {
        salesperson: true,
        products: true,
      },
    });

    // Enrichir les produits avec les informations BCItem
    const enrichmentBcIds = updated.products.map(p => p.productId);
    const enrichmentBcItems = await this.prisma.bCItem.findMany({
      where: { bcId: { in: enrichmentBcIds } },
    });
    const bcItemsMap = new Map(enrichmentBcItems.map(item => [item.bcId, item]));

    return {
      ...updated,
      products: updated.products.map(p => ({
        ...p,
        bcItem: bcItemsMap.get(p.productId) || null,
      })),
    };
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.chargementType.delete({ where: { id } });
    return { message: 'Chargement type deleted successfully' };
  }

  async duplicate(id: number, targetSalespersonId: number) {
    const source = await this.findOne(id);

    // Vérifier que le salesperson cible existe
    const targetSalesperson = await this.prisma.salesperson.findUnique({
      where: { id: targetSalespersonId },
    });
    if (!targetSalesperson) {
      throw new NotFoundException('Target salesperson not found');
    }

    // Vérifier qu'il n'existe pas déjà un chargement type pour ce salesperson
    const existing = await this.prisma.chargementType.findFirst({
      where: { salespersonId: targetSalespersonId },
    });
    if (existing) {
      throw new ConflictException('Un chargement type existe déjà pour ce vendeur');
    }

    // Dupliquer le chargement type
    const duplicated = await this.prisma.chargementType.create({
      data: {
        salespersonId: targetSalespersonId,
        name: null,
        products: {
          create: source.products.map((p) => ({
            productId: p.productId, // bcId directement
            qte: p.qte,
          })),
        },
      },
      include: {
        salesperson: true,
        products: true,
      },
    });

    // Enrichir les produits avec les informations BCItem
    const bcIds = duplicated.products.map(p => p.productId);
    const bcItems = await this.prisma.bCItem.findMany({
      where: { bcId: { in: bcIds } },
    });
    const bcItemsMap = new Map(bcItems.map(item => [item.bcId, item]));

    return {
      ...duplicated,
      products: duplicated.products.map(p => ({
        ...p,
        bcItem: bcItemsMap.get(p.productId) || null,
      })),
    };
  }

  async getAvailableProducts() {
    return this.prisma.bCItem.findMany({
      where: {
        blocked: false,
      },
      orderBy: {
        displayName: 'asc',
      },
      select: {
        id: true,
        number: true,
        displayName: true,
        bcId: true,
      },
    });
  }
}

