import { Module } from '@nestjs/common';
import { TypeClientsService } from './type-clients.service';
import { TypeClientsController } from './type-clients.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeClientsController],
  providers: [TypeClientsService],
})
export class TypeClientsModule {}


