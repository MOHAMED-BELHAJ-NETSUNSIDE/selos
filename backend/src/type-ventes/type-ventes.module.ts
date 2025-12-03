import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { TypeVentesService } from './type-ventes.service';
import { TypeVentesController } from './type-ventes.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TypeVentesController],
  providers: [TypeVentesService],
})
export class TypeVentesModule {}


