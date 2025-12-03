import { Module } from '@nestjs/common';
import { ClientsService } from './clients.service';
import { ClientsController } from './clients.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { LogsModule } from '../logs/logs.module';

@Module({
  imports: [PrismaModule, LogsModule],
  controllers: [ClientsController],
  providers: [ClientsService],
})
export class ClientsModule {}




