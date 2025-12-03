import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSalespersonDto } from './dto/create-salesperson.dto';
import { UpdateSalespersonDto } from './dto/update-salesperson.dto';
import { QuerySalespersonDto } from './dto/query-salesperson.dto';
import { LogsService } from '../logs/logs.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class SalespersonsService {
  constructor(
    private prisma: PrismaService,
    private logsService: LogsService,
  ) {}

  async create(createSalespersonDto: CreateSalespersonDto, userId: string) {
    // Validation des champs requis
    if (!createSalespersonDto.bcCustomerId || !createSalespersonDto.bcCustomerId.trim()) {
      throw new BadRequestException('Le client Business Central est obligatoire');
    }
    if (!createSalespersonDto.login || !createSalespersonDto.login.trim()) {
      throw new BadRequestException('Le login est requis');
    }
    if (!createSalespersonDto.password || !createSalespersonDto.password.trim()) {
      throw new BadRequestException('Le mot de passe est requis');
    }
    if (!createSalespersonDto.secteurId) {
      throw new BadRequestException('Le secteur est obligatoire');
    }

    // Récupérer et valider le client BC (obligatoire)
    const bcCustomer = await this.prisma.bCCustomer.findUnique({
      where: { bcId: createSalespersonDto.bcCustomerId },
    });

    if (!bcCustomer) {
      throw new NotFoundException('Le client Business Central spécifié n\'existe pas');
    }

    // Récupérer et valider le secteur (obligatoire)
    if (createSalespersonDto.secteurId) {
      const secteur = await this.prisma.secteur.findUnique({
        where: { id: createSalespersonDto.secteurId },
      });

      if (!secteur) {
        throw new NotFoundException('Le secteur spécifié n\'existe pas');
      }
    }

    // Vérifier qu'aucun autre vendeur n'est déjà associé à ce client BC
    const existingSalesperson = await this.prisma.salesperson.findUnique({
      where: { bcCustomerId: createSalespersonDto.bcCustomerId },
    });

    if (existingSalesperson) {
      throw new ConflictException('Ce client Business Central est déjà associé à un autre vendeur');
    }

    // Extraire automatiquement les informations du client BC
    // Parser le displayName pour obtenir firstName et lastName
    let firstName = '';
    let lastName = '';
    if (bcCustomer.displayName) {
      const nameParts = bcCustomer.displayName.trim().split(/\s+/);
      if (nameParts.length >= 2) {
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ');
      } else if (nameParts.length === 1) {
        // Si un seul mot, le mettre dans lastName
        lastName = nameParts[0];
      }
    }

    // Utiliser les valeurs du DTO si fournies, sinon utiliser celles du client BC
    firstName = createSalespersonDto.firstName?.trim() || firstName || 'N/A';
    lastName = createSalespersonDto.lastName?.trim() || lastName || 'N/A';
    const telephone = createSalespersonDto.telephone?.trim() || bcCustomer.phoneNumber || null;
    const email = createSalespersonDto.email?.trim() || bcCustomer.email || null;
    const tva = bcCustomer.taxRegistrationNumber || null; // TVA récupérée depuis BC
    const bcCode = bcCustomer.number || null; // Code BC (number) pour la traçabilité

    // Vérifier l'unicité du login
    const existingLogin = await this.prisma.salesperson.findUnique({
      where: { login: createSalespersonDto.login.trim() },
    });

    if (existingLogin) {
      throw new ConflictException('Ce login est déjà utilisé');
    }

    // Vérifier l'unicité de l'email si fourni
    if (email && email.trim()) {
      const existingEmail = await this.prisma.salesperson.findUnique({
        where: { email: email.trim() },
      });

      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Générer automatiquement le code vendeur
    let code = `VEN-${Date.now().toString().slice(-6)}`;
    let codeExists = true;
    let counter = 1;
    
    // Vérifier l'unicité du code généré
    while (codeExists) {
      const existingCode = await this.prisma.salesperson.findUnique({
        where: { code },
      });
      if (!existingCode) {
        codeExists = false;
      } else {
        code = `VEN-${Date.now().toString().slice(-6)}-${counter}`;
        counter++;
      }
    }

    // Hash du mot de passe
    const hashedPassword = await bcrypt.hash(createSalespersonDto.password, 10);

    // Générer automatiquement le nom du dépôt (nom du vendeur)
    // firstName et lastName sont déjà définis plus haut depuis le client BC
    const depotName = `${firstName} ${lastName}`.trim();

    // Validation stricte de depotName
    if (!depotName || typeof depotName !== 'string' || depotName.length === 0) {
      throw new BadRequestException('Le nom du dépôt ne peut pas être vide');
    }

    // Préparer les données pour Prisma avec validation stricte
    const salespersonData: any = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      code: String(code),
      telephone: telephone,
      tva: tva, // TVA récupérée depuis BC
      adresse: createSalespersonDto.adresse?.trim() || null,
      dateEmbauche: createSalespersonDto.dateEmbauche || null,
      statut: createSalespersonDto.statut || 'actif',
      login: String(createSalespersonDto.login).trim(),
      password: String(hashedPassword),
      depotName: String(depotName), // Forcer le type string
      depotAdresse: createSalespersonDto.depotAdresse?.trim() || null,
      depotTel: createSalespersonDto.depotTel?.trim() || null,
      depotStatus: Number(createSalespersonDto.depotStatus ?? 1),
      depotRemarque: createSalespersonDto.depotRemarque?.trim() || null,
      bcCustomerId: createSalespersonDto.bcCustomerId, // Obligatoire
      bcCode: bcCode, // Code BC pour la traçabilité
      bcLocationId: createSalespersonDto.bcLocationId || null,
      secteurId: createSalespersonDto.secteurId || null, // Optionnel temporairement
    };

    // Vérification finale que depotName est bien une string non vide
    if (typeof salespersonData.depotName !== 'string' || salespersonData.depotName.length === 0) {
      throw new BadRequestException(`Le nom du dépôt doit être une chaîne de caractères valide. Reçu: ${typeof salespersonData.depotName}`);
    }

    // Créer le vendeur avec les relations many-to-many
    const salesperson = await this.prisma.salesperson.create({
      data: {
        ...salespersonData,
        salespersonCanals: createSalespersonDto.canalIds && createSalespersonDto.canalIds.length > 0
          ? {
              create: createSalespersonDto.canalIds.map((canalId) => ({
                canalId,
              })),
            }
          : undefined,
        salespersonTypeVentes: createSalespersonDto.typeVenteIds && createSalespersonDto.typeVenteIds.length > 0
          ? {
              create: createSalespersonDto.typeVenteIds.map((typeVenteId) => ({
                typeVenteId,
              })),
            }
          : undefined,
      },
      include: {
        salespersonCanals: {
          include: {
            canal: true,
          },
        },
        salespersonTypeVentes: {
          include: {
            typeVente: true,
          },
        },
      },
    });

    // Log the creation
    this.logsService.emitLog({
      userId,
      module: 'salesperson',
      action: 'create',
      recordId: salesperson.id.toString(),
      description: `Vendeur ${salesperson.firstName} ${salesperson.lastName} (${salesperson.code || salesperson.login}) créé`,
      newData: { ...salesperson, password: '[HIDDEN]' },
    });

    const { password, ...salespersonWithoutPassword } = salesperson;
    return salespersonWithoutPassword;
  }

  async findAll(query: QuerySalespersonDto, user?: any) {
    const { page = 1, limit = 10, search } = query;
    const skip = (page - 1) * limit;

    // Construire la condition where de base
    const where: any = {};

    // Si l'utilisateur a un magasin (bcLocationId), filtrer les vendeurs par ce magasin
    const userLocationId = user?.bcLocationId || null;
    const hasLocationFilter = userLocationId !== null && userLocationId !== undefined;
    const hasSearch = search && search.trim().length > 0;

    // Debug: log pour vérifier le filtrage
    console.log(`[SalespersonsService] User:`, {
      id: user?.id,
      bcLocationId: user?.bcLocationId,
      userLocationId,
      hasLocationFilter,
    });

    // Debug: compter les vendeurs par bcLocationId
    if (hasLocationFilter) {
      const allSalespersons = await this.prisma.salesperson.findMany({
        select: { id: true, bcLocationId: true, firstName: true, lastName: true },
      });
      console.log(`[SalespersonsService] Total salespersons in DB:`, allSalespersons.length);
      console.log(`[SalespersonsService] Salespersons by bcLocationId:`, 
        allSalespersons.reduce((acc, sp) => {
          const key = sp.bcLocationId?.toString() || 'null';
          acc[key] = (acc[key] || 0) + 1;
          return acc;
        }, {} as Record<string, number>)
      );
      console.log(`[SalespersonsService] Looking for salespersons with bcLocationId = ${userLocationId}`);
    }

    if (hasLocationFilter && hasSearch) {
      // Si on a les deux conditions, utiliser AND pour les combiner
      where.AND = [
        { bcLocationId: userLocationId },
        {
          OR: [
            { code: { contains: search } },
            { login: { contains: search } },
            { depotName: { contains: search } },
            { firstName: { contains: search } },
            { lastName: { contains: search } },
            { email: { contains: search } },
          ],
        },
      ];
    } else if (hasLocationFilter) {
      // Seulement le filtre par magasin
      where.bcLocationId = userLocationId;
    } else if (hasSearch) {
      // Seulement la recherche
      where.OR = [
        { code: { contains: search } },
        { login: { contains: search } },
        { depotName: { contains: search } },
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { email: { contains: search } },
      ];
    }

    // Debug: log la condition where
    console.log(`[SalespersonsService] Where condition:`, JSON.stringify(where, null, 2));

    const [salespersons, total] = await Promise.all([
      this.prisma.salesperson.findMany({
        where,
        include: {
          bcCustomer: {
            select: {
              bcId: true,
              number: true,
              displayName: true,
              email: true,
              phoneNumber: true,
            },
          },
          bcLocation: true,
          secteur: true,
          salespersonCanals: {
            include: {
              canal: true,
            },
          },
          salespersonTypeVentes: {
            include: {
              typeVente: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.salesperson.count({ where }),
    ]);

    // Debug: log les résultats
    console.log(`[SalespersonsService] Found ${salespersons.length} salespersons (total: ${total})`);
    if (salespersons.length > 0) {
      console.log(`[SalespersonsService] First salesperson bcLocationId:`, salespersons[0].bcLocationId);
    }

    // Remove passwords from response
    const salespersonsWithoutPasswords = salespersons.map(({ password, ...salesperson }) => salesperson);

    return {
      data: salespersonsWithoutPasswords,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id },
      include: {
        bcCustomer: {
          select: {
            bcId: true,
            number: true,
            displayName: true,
            email: true,
            phoneNumber: true,
            addressStreet: true,
            addressCity: true,
            addressPostalCode: true,
            addressCountry: true,
          },
        },
        bcLocation: true,
        secteur: true,
        salespersonCanals: {
          include: {
            canal: true,
          },
        },
        salespersonTypeVentes: {
          include: {
            typeVente: true,
          },
        },
      },
    });

    if (!salesperson) {
      throw new NotFoundException('Vendeur non trouvé');
    }

    const { password, ...salespersonWithoutPassword } = salesperson;
    return salespersonWithoutPassword;
  }

  async update(id: number, updateSalespersonDto: UpdateSalespersonDto, userId: string) {
    const existingSalesperson = await this.findOne(id);

    // Vérifier l'unicité du login si modifié
    if (updateSalespersonDto.login && updateSalespersonDto.login !== existingSalesperson.login) {
      const existingLogin = await this.prisma.salesperson.findUnique({
        where: { login: updateSalespersonDto.login },
      });

      if (existingLogin) {
        throw new ConflictException('Ce login est déjà utilisé');
      }
    }

    // Vérifier l'unicité de l'email si modifié
    if (updateSalespersonDto.email && updateSalespersonDto.email !== existingSalesperson.email) {
      const existingEmail = await this.prisma.salesperson.findUnique({
        where: { email: updateSalespersonDto.email },
      });

      if (existingEmail) {
        throw new ConflictException('Cet email est déjà utilisé');
      }
    }

    // Le code ne peut pas être modifié (généré automatiquement)
    // Le code n'est pas dans le DTO, donc pas besoin de le supprimer

    // Hash du nouveau mot de passe si fourni
    const updateData: any = { ...updateSalespersonDto };

    // Vérifier et valider le client BC si modifié
    if (updateSalespersonDto.bcCustomerId !== undefined) {
      if (updateSalespersonDto.bcCustomerId === null) {
        // Dissociation du client BC
        updateData.bcCustomerId = null;
        updateData.bcCode = null; // Supprimer aussi le code BC
      } else if (updateSalespersonDto.bcCustomerId !== existingSalesperson.bcCustomerId) {
        // Nouvelle association
        const bcCustomer = await this.prisma.bCCustomer.findUnique({
          where: { bcId: updateSalespersonDto.bcCustomerId },
        });

        if (!bcCustomer) {
          throw new NotFoundException('Le client Business Central spécifié n\'existe pas');
        }
        
        // Mettre à jour le code BC lors du changement de client BC
        updateData.bcCode = bcCustomer.number || null;

        // Vérifier qu'aucun autre vendeur n'est déjà associé à ce client BC
        const existingSalespersonWithBC = await this.prisma.salesperson.findUnique({
          where: { bcCustomerId: updateSalespersonDto.bcCustomerId },
        });

        if (existingSalespersonWithBC && existingSalespersonWithBC.id !== id) {
          throw new ConflictException('Ce client Business Central est déjà associé à un autre vendeur');
        }

        updateData.bcCustomerId = updateSalespersonDto.bcCustomerId;
      }
    }

    // Gérer bcLocationId (peut être null pour supprimer le magasin)
    if (updateSalespersonDto.bcLocationId !== undefined) {
      updateData.bcLocationId = updateSalespersonDto.bcLocationId === null ? null : updateSalespersonDto.bcLocationId;
    }

    // Vérifier et valider le secteur si modifié
    if (updateSalespersonDto.secteurId !== undefined) {
      const secteur = await this.prisma.secteur.findUnique({
        where: { id: updateSalespersonDto.secteurId },
      });

      if (!secteur) {
        throw new NotFoundException('Le secteur spécifié n\'existe pas');
      }

      updateData.secteurId = updateSalespersonDto.secteurId;
    }

    if (updateSalespersonDto.password) {
      updateData.password = await bcrypt.hash(updateSalespersonDto.password, 10);
    }
    
    // Le nom du dépôt est automatiquement mis à jour avec le nom du vendeur
    if (updateSalespersonDto.firstName || updateSalespersonDto.lastName) {
      const firstName = (updateSalespersonDto.firstName || existingSalesperson.firstName).trim();
      const lastName = (updateSalespersonDto.lastName || existingSalesperson.lastName).trim();
      const depotName = `${firstName} ${lastName}`.trim();
      if (depotName && depotName.length > 0) {
        updateData.depotName = depotName;
      }
    }
    
    // Nettoyer les valeurs vides pour les champs optionnels
    if (updateData.email === '') updateData.email = null;
    if (updateData.telephone === '') updateData.telephone = null;
    if (updateData.adresse === '') updateData.adresse = null;
    if (updateData.depotAdresse === '') updateData.depotAdresse = null;
    if (updateData.depotTel === '') updateData.depotTel = null;
    if (updateData.depotRemarque === '') updateData.depotRemarque = null;

    // Gérer les relations many-to-many pour les canaux
    if (updateSalespersonDto.canalIds !== undefined) {
      // Supprimer toutes les relations existantes
      await this.prisma.salespersonCanal.deleteMany({
        where: { salespersonId: id },
      });
      // Créer les nouvelles relations
      if (updateSalespersonDto.canalIds.length > 0) {
        await this.prisma.salespersonCanal.createMany({
          data: updateSalespersonDto.canalIds.map((canalId) => ({
            salespersonId: id,
            canalId,
          })),
        });
      }
      // Ne pas inclure canalIds dans updateData
      delete updateData.canalIds;
    }

    // Gérer les relations many-to-many pour les types de vente
    if (updateSalespersonDto.typeVenteIds !== undefined) {
      // Supprimer toutes les relations existantes
      await this.prisma.salespersonTypeVente.deleteMany({
        where: { salespersonId: id },
      });
      // Créer les nouvelles relations
      if (updateSalespersonDto.typeVenteIds.length > 0) {
        await this.prisma.salespersonTypeVente.createMany({
          data: updateSalespersonDto.typeVenteIds.map((typeVenteId) => ({
            salespersonId: id,
            typeVenteId,
          })),
        });
      }
      // Ne pas inclure typeVenteIds dans updateData
      delete updateData.typeVenteIds;
    }

    const salesperson = await this.prisma.salesperson.update({
      where: { id },
      data: updateData,
      include: {
        salespersonCanals: {
          include: {
            canal: true,
          },
        },
        salespersonTypeVentes: {
          include: {
            typeVente: true,
          },
        },
      },
    });

    // Log the update
    this.logsService.emitLog({
      userId,
      module: 'salesperson',
      action: 'update',
      recordId: salesperson.id.toString(),
      description: `Vendeur ${salesperson.firstName} ${salesperson.lastName} (${salesperson.code || salesperson.login}) modifié`,
      oldData: { ...existingSalesperson, password: '[HIDDEN]' },
      newData: { ...salesperson, password: '[HIDDEN]' },
    });

    const { password, ...salespersonWithoutPassword } = salesperson;
    return salespersonWithoutPassword;
  }

  async remove(id: number, userId: string) {
    const existingSalesperson = await this.findOne(id);

    await this.prisma.salesperson.delete({
      where: { id },
    });

    // Log the deletion
    this.logsService.emitLog({
      userId,
      module: 'salesperson',
      action: 'delete',
      recordId: id.toString(),
      description: `Vendeur ${existingSalesperson.firstName} ${existingSalesperson.lastName} (${existingSalesperson.code || existingSalesperson.login}) supprimé`,
      oldData: { ...existingSalesperson, password: '[HIDDEN]' },
      newData: null,
    });

    return { message: 'Vendeur supprimé avec succès' };
  }
}

