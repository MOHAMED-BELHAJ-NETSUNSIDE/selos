import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { LocalitesService } from './localites.service';
import { LocalitesController } from './localites.controller';

@Module({
  imports: [PrismaModule],
  controllers: [LocalitesController],
  providers: [LocalitesService],
})
export class LocalitesModule {}


