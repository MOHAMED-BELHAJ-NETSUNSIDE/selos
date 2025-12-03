import { Module } from '@nestjs/common';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { BusinessCentralModule } from '../business-central/business-central.module';

@Module({
  imports: [PrismaModule, BusinessCentralModule],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService],
})
export class StockModule {}

