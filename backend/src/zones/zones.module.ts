import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { ZonesService } from './zones.service';
import { ZonesController } from './zones.controller';

@Module({
  imports: [PrismaModule],
  controllers: [ZonesController],
  providers: [ZonesService],
})
export class ZonesModule {}


