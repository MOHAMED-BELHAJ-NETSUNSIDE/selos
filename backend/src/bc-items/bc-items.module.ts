import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BCItemsService } from './bc-items.service';
import { BCItemsController } from './bc-items.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BCItemsController],
  providers: [BCItemsService],
})
export class BCItemsModule {}

