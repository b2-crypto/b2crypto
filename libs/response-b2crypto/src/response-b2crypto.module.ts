import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ResponseB2CryptoService } from './response-b2crypto.service';

@Module({
  imports: [ConfigModule],
  providers: [ResponseB2CryptoService],
  exports: [ResponseB2CryptoService],
})
export class ResponseB2CryptoModule {}
