import { Module } from '@nestjs/common';
import { SalespersonsService } from './salespersons.service';
import { SalespersonsController } from './salespersons.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [PrismaModule, LogsModule],
  controllers: [SalespersonsController],
  providers: [SalespersonsService],
  exports: [SalespersonsService],
})
export class SalespersonsModule {}

