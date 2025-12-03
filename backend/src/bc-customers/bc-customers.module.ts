import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { BCCustomersService } from './bc-customers.service';
import { BCCustomersController } from './bc-customers.controller';

@Module({
  imports: [PrismaModule],
  controllers: [BCCustomersController],
  providers: [BCCustomersService],
})
export class BCCustomersModule {}

