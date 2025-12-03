import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GetLocationsDto } from './dto/get-locations.dto';
import { BCLocation } from './dto/bc-location.dto';

@Injectable()
export class BCLocationsService {
  constructor(private prisma: PrismaService) {}

  async findAll(query: GetLocationsDto) {
    const where: any = {};

    if (query.search) {
      where.OR = [
        { displayName: { contains: query.search } },
        { code: { contains: query.search } },
      ];
    }

    const locations = await this.prisma.bCLocation.findMany({
      where,
      orderBy: { displayName: 'asc' },
    });

    return {
      success: true,
      data: locations,
      count: locations.length,
    };
  }

  async findOne(id: number) {
    const location = await this.prisma.bCLocation.findUnique({
      where: { id },
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }

  async syncLocations(locations: BCLocation[]) {
    let count = 0;
    const logs: string[] = [];

    for (const location of locations) {
      try {
        const rawLocation = location as any;
        
        // Mapper les adresses depuis location.address ou depuis les champs directs de BC
        const address = location.address || rawLocation.addressLine1 || rawLocation.address || null;
        const address2 = location.address2 || rawLocation.addressLine2 || null;
        const city = location.city || rawLocation.city || null;
        const state = location.state || rawLocation.state || null;
        const country = location.country || rawLocation.country || null;
        const postalCode = location.postalCode || rawLocation.postalCode || null;
        
        await this.prisma.bCLocation.upsert({
          where: { bcId: location.id },
          update: {
            code: location.code || null,
            displayName: location.displayName || null,
            address,
            address2,
            city,
            state,
            country,
            postalCode,
            phoneNumber: location.phoneNumber || null,
            email: location.email || null,
            contact: location.contact || null,
            useAsInTransit: location.useAsInTransit ?? false,
            requireShipment: location.requireShipment ?? false,
            requireReceive: location.requireReceive ?? false,
            requirePutAway: location.requirePutAway ?? false,
            requirePick: location.requirePick ?? false,
            lastModified: location.lastModifiedDateTime 
              ? new Date(location.lastModifiedDateTime) 
              : null,
            etag: location['@odata.etag'] || null,
            rawJson: location as any,
          },
          create: {
            bcId: location.id,
            code: location.code || null,
            displayName: location.displayName || null,
            address,
            address2,
            city,
            state,
            country,
            postalCode,
            phoneNumber: location.phoneNumber || null,
            email: location.email || null,
            contact: location.contact || null,
            useAsInTransit: location.useAsInTransit ?? false,
            requireShipment: location.requireShipment ?? false,
            requireReceive: location.requireReceive ?? false,
            requirePutAway: location.requirePutAway ?? false,
            requirePick: location.requirePick ?? false,
            lastModified: location.lastModifiedDateTime 
              ? new Date(location.lastModifiedDateTime) 
              : null,
            etag: location['@odata.etag'] || null,
            rawJson: location as any,
          },
        });

        count++;

        if (count % 500 === 0) {
          logs.push(`Committed batch: ${count}`);
        }
      } catch (error) {
        console.error('Error processing location:', error);
        logs.push(`Error processing location ${location.id}: ${error}`);
      }
    }

    logs.push(`Done. Total locations synced: ${count}`);

    return {
      success: true,
      count,
      logs,
    };
  }
}

