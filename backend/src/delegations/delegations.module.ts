import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { DelegationsService } from './delegations.service';
import { DelegationsController } from './delegations.controller';

@Module({
  imports: [PrismaModule],
  controllers: [DelegationsController],
  providers: [DelegationsService],
})
export class DelegationsModule {}


