import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CanalsService } from './canals.service';
import { CanalsController } from './canals.controller';

@Module({
  imports: [PrismaModule],
  controllers: [CanalsController],
  providers: [CanalsService],
})
export class CanalsModule {}


