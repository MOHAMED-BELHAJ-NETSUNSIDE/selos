import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SecteursService } from './secteurs.service';
import { SecteursController } from './secteurs.controller';

@Module({
  imports: [PrismaModule],
  controllers: [SecteursController],
  providers: [SecteursService],
})
export class SecteursModule {}


