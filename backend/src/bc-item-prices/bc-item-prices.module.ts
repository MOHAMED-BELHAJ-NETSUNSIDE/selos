import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BCItemPricesService } from './bc-item-prices.service';
import { BCItemPricesController } from './bc-item-prices.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BCItemPricesController],
  providers: [BCItemPricesService],
  exports: [BCItemPricesService],
})
export class BCItemPricesModule {}

