import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CircuitCommercialService } from './circuit-commercial.service';
import { CircuitCommercialController } from './circuit-commercial.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CircuitCommercialController],
  providers: [CircuitCommercialService],
  exports: [CircuitCommercialService],
})
export class CircuitCommercialModule {}


