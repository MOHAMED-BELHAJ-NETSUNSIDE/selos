import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ChargementTypesService } from './chargement-types.service';
import { ChargementTypesController } from './chargement-types.controller';
import { PurchaseOrdersModule } from '../purchase-orders/purchase-orders.module';

@Module({
  imports: [PrismaModule, PurchaseOrdersModule],
  controllers: [ChargementTypesController],
  providers: [ChargementTypesService],
})
export class ChargementTypesModule {}

