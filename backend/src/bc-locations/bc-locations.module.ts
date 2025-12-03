import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BCLocationsService } from './bc-locations.service';
import { BCLocationsController } from './bc-locations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BCLocationsController],
  providers: [BCLocationsService],
})
export class BCLocationsModule {}

