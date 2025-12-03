import { Module } from '@nestjs/common';
import { TypeUsersService } from './type-users.service';
import { TypeUsersController } from './type-users.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TypeUsersController],
  providers: [TypeUsersService],
})
export class TypeUsersModule {}


