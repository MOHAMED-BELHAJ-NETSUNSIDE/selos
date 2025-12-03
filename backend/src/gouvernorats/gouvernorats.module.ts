import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { GouvernoratsService } from './gouvernorats.service';
import { GouvernoratsController } from './gouvernorats.controller';

@Module({
  imports: [PrismaModule],
  controllers: [GouvernoratsController],
  providers: [GouvernoratsService],
})
export class GouvernoratsModule {}


