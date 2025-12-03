import { Injectable, NotFoundException, ConflictException, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLocaliteDto } from './dto/create-localite.dto';
import { UpdateLocaliteDto } from './dto/update-localite.dto';
import { QueryLocalitesDto } from './dto/query-localites.dto';

@Injectable()
export class LocalitesService {
  private readonly CACHE_KEY_PREFIX = 'localites';
  private readonly CACHE_TTL = 300000; // 5 minutes en millisecondes
  private readonly usedCacheKeys = new Set<string>(); // Track des clés de cache utilisées

  constructor(
    private prisma: PrismaService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async create(dto: CreateLocaliteDto) {
    const result = await this.prisma.localite.create({ data: dto });
    // Invalider le cache après création
    await this.invalidateCache();
    return result;
  }

  async findAll(query?: QueryLocalitesDto) {
    const limit = query?.limit ?? 100;
    const offset = query?.offset ?? 0;

    // Créer une clé de cache unique basée sur les paramètres de pagination
    const cacheKey = `${this.CACHE_KEY_PREFIX}:all:${limit}:${offset}`;

    // Enregistrer la clé utilisée
    this.usedCacheKeys.add(cacheKey);

    // Essayer de récupérer depuis le cache
    const cached = await this.cacheManager.get<{
      data: any[];
      total: number;
      limit: number;
      offset: number;
      hasMore: boolean;
    }>(cacheKey);

    if (cached) {
      return cached;
    }

    // Si pas en cache, récupérer depuis la base de données
    const [data, total] = await Promise.all([
      this.prisma.localite.findMany({
        skip: offset,
        take: limit,
        orderBy: { id: 'asc' },
        include: { delegation: { include: { gouvernorat: true } } },
      }),
      this.prisma.localite.count(),
    ]);

    const result = {
      data,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };

    // Mettre en cache le résultat
    await this.cacheManager.set(cacheKey, result, this.CACHE_TTL);

    return result;
  }

  async findOne(id: number) {
    const item = await this.prisma.localite.findUnique({
      where: { id },
      include: { delegation: { include: { gouvernorat: true } } },
    });
    if (!item) throw new NotFoundException('Localité not found');
    return item;
  }

  async update(id: number, dto: UpdateLocaliteDto) {
    await this.findOne(id);
    const result = await this.prisma.localite.update({ where: { id }, data: dto });
    // Invalider le cache après mise à jour
    await this.invalidateCache();
    return result;
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.prisma.localite.delete({ where: { id } });
    // Invalider le cache après suppression
    await this.invalidateCache();
    return { message: 'Localité deleted successfully' };
  }

  /**
   * Invalide toutes les clés de cache des localités
   */
  private async invalidateCache() {
    // Supprimer toutes les clés de cache qui ont été utilisées
    const keysToDelete = Array.from(this.usedCacheKeys);
    
    // Supprimer chaque clé
    await Promise.all(
      keysToDelete.map(key => this.cacheManager.del(key))
    );
    
    // Réinitialiser le Set des clés utilisées
    this.usedCacheKeys.clear();
  }
}


