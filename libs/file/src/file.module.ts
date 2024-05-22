import { CommonModule } from '@common/common';
import { FileServiceMongooseService } from '@file/file/file-service-mongoose.service';
import { Module } from '@nestjs/common';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { fileProviders } from './providers/file.providers';

@Module({
  imports: [CommonModule, ResponseB2CryptoModule],
  providers: [FileServiceMongooseService, ...fileProviders],
  exports: [FileServiceMongooseService, ...fileProviders],
})
export class FileModule {}
