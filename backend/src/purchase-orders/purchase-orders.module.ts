import { Module } from '@nestjs/common';
import { PurchaseOrdersService } from './purchase-orders.service';
import { PurchaseOrdersController } from './purchase-orders.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';
import { BusinessCentralModule } from '../business-central/business-central.module';

@Module({
  imports: [PrismaModule, LogsModule, BusinessCentralModule],
  controllers: [PurchaseOrdersController],
  providers: [PurchaseOrdersService],
  exports: [PurchaseOrdersService],
})
export class PurchaseOrdersModule {}

