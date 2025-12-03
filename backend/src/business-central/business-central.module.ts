import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BusinessCentralService } from './business-central.service';

@Module({
  imports: [ConfigModule],
  providers: [BusinessCentralService],
  exports: [BusinessCentralService],
})
export class BusinessCentralModule {}

