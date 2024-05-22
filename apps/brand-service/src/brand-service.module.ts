import { BrandServiceController } from './brand-service.controller';
import { BrandServiceService } from './brand-service.service';
import { BuildersModule } from '@builder/builders';
import { BrandModule } from 'libs/brand/src';
import { Module } from '@nestjs/common';

@Module({
  imports: [BrandModule, BuildersModule],
  controllers: [BrandServiceController],
  providers: [BrandServiceService],
})
export class BrandServiceModule {}
