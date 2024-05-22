import { CategoryServiceMongooseService } from '@category/category/category-service-mongoose.service';
import { CommonModule } from '@common/common';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { categoryProviders } from './providers/category.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [CategoryServiceMongooseService, ...categoryProviders],
  exports: [CategoryServiceMongooseService, ...categoryProviders],
})
export class CategoryModule {}
