import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { RegionsService } from './regions.service';
import { RegionsController } from './regions.controller';

@Module({
  imports: [PrismaModule],
  controllers: [RegionsController],
  providers: [RegionsService],
})
export class RegionsModule {}


