import { Module } from '@nestjs/common';
import { ReturnInvoicesService } from './return-invoices.service';
import { ReturnInvoicesController } from './return-invoices.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessCentralModule } from '../business-central/business-central.module';

@Module({
  imports: [PrismaModule, BusinessCentralModule],
  controllers: [ReturnInvoicesController],
  providers: [ReturnInvoicesService],
  exports: [ReturnInvoicesService],
})
export class ReturnInvoicesModule {}

