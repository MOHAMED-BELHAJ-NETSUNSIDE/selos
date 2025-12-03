import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SousRegionsService } from './sous-regions.service';
import { SousRegionsController } from './sous-regions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SousRegionsController],
  providers: [SousRegionsService],
})
export class SousRegionsModule {}


