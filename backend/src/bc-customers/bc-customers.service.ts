import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetCustomersDto } from './dto/get-customers.dto';
import { BCCustomer } from './dto/bc-customer.dto';
import { UpdateLocalFieldsDto } from './dto/update-local-fields.dto';

@Injectable()
export class BCCustomersService {
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

  async findAll(query: GetCustomersDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search } },
        { number: { contains: query.search } },
      ];
    }

    const customers = await this.prisma.bCCustomer.findMany({
      where,
      orderBy: { displayName: 'asc' },
    });

    return {
      success: true,
      data: customers,
      count: customers.length,
    };
  }

  async findOne(id: number) {
    const customer = await this.prisma.bCCustomer.findUnique({
      where: { id },
      include: {
        localCanal: true,
        localTypeVente: true,
      },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async updateLocalFields(id: number, dto: UpdateLocalFieldsDto) {
    const customer = await this.prisma.bCCustomer.findUnique({
      where: { id },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    const updateData: any = {};
    if (dto.localCanalId !== undefined) {
      updateData.localCanalId = dto.localCanalId || null;
    }
    if (dto.localTypeVenteId !== undefined) {
      updateData.localTypeVenteId = dto.localTypeVenteId || null;
    }

    return this.prisma.bCCustomer.update({
      where: { id },
      data: updateData,
      include: {
        localCanal: true,
        localTypeVente: true,
      },
    });
  }

  async syncCustomers(customers: BCCustomer[]) {
    let count = 0;
    const logs: string[] = [];

    for (const customer of customers) {
      try {
        // Récupérer les valeurs locales existantes avant l'upsert pour les préserver
        const existing = await this.prisma.bCCustomer.findUnique({
          where: { bcId: customer.id },
          select: {
            localCanalId: true,
            localTypeVenteId: true,
          },
        });

        // Mapper les adresses depuis customer.address ou depuis les champs directs de BC
        const address = customer.address || {};
        const rawCustomer = customer as any;
        
        // Business Central peut renvoyer les adresses directement sur l'objet (addressLine1, city, etc.)
        const addressStreet = address.street || rawCustomer.addressLine1 || rawCustomer.addressLine2 || null;
        const addressCity = address.city || rawCustomer.city || null;
        const addressState = address.state || rawCustomer.state || null;
        const addressCountry = address.countryLetterCode || address.country || rawCustomer.country || null;
        const addressPostalCode = address.postalCode || rawCustomer.postalCode || null;
        
        const blockedValue = this.normalizeBlocked(customer.blocked);
        
        await this.prisma.bCCustomer.upsert({
          where: { bcId: customer.id },
          update: {
            number: customer.number || null,
            displayName: customer.displayName || null,
            type: customer.type || null,
            blocked: blockedValue,
            phoneNumber: customer.phoneNumber || null,
            email: customer.email || null,
            currencyCode: customer.currencyCode || null,
            taxRegistrationNumber: customer.taxRegistrationNumber || null,
            addressStreet,
            addressCity,
            addressState,
            addressCountry,
            addressPostalCode,
            lastModified: customer.lastModifiedDateTime 
              ? new Date(customer.lastModifiedDateTime) 
              : null,
            etag: customer['@odata.etag'] || null,
            rawJson: customer as any,
            // Préserver les champs locaux existants
            localCanalId: existing?.localCanalId ?? undefined,
            localTypeVenteId: existing?.localTypeVenteId ?? undefined,
          },
          create: {
            bcId: customer.id,
            number: customer.number || null,
            displayName: customer.displayName || null,
            type: customer.type || null,
            blocked: blockedValue,
            phoneNumber: customer.phoneNumber || null,
            email: customer.email || null,
            currencyCode: customer.currencyCode || null,
            taxRegistrationNumber: customer.taxRegistrationNumber || null,
            addressStreet,
            addressCity,
            addressState,
            addressCountry,
            addressPostalCode,
            lastModified: customer.lastModifiedDateTime 
              ? new Date(customer.lastModifiedDateTime) 
              : null,
            etag: customer['@odata.etag'] || null,
            rawJson: customer as any,
            // Champs locaux avec valeurs par défaut (null)
          },
        });

        count++;

        if (count % 500 === 0) {
          logs.push(`Committed batch: ${count}`);
        }
      } catch (error) {
        console.error('Error processing customer:', error);
        logs.push(`Error processing customer ${customer.id}: ${error}`);
      }
    }

    logs.push(`Done. Total customers synced: ${count}`);

    return {
      success: true,
      count,
      logs,
    };
  }
}

