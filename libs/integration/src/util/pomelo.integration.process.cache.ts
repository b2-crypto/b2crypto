import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class PomeloCache {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly constants: PomeloProcessConstants,
  ) {}

  async getResponse(idempotency: string): Promise<any> {
    return await this.cacheManager.get<string>(idempotency);
  }

  async setTooEarly(idempotency: string): Promise<string | any> {
    this.setCache(idempotency, this.constants.RESPONSE_TOO_EARLY);
    return this.constants.RESPONSE_TOO_EARLY;
  }

  async setInvalidSignature(idempotency: string) {
    await this.setCache(idempotency, this.constants.RESPONSE_INVALID_SIGNATURE);
    return this.constants.RESPONSE_INVALID_SIGNATURE;
  }

  async setSignatureExpired(idempotency: string) {
    this.setCache(idempotency, this.constants.RESPONSE_SIGNATURE_EXPIRE);
  }

  async setResponseReceived(idempotency: string): Promise<string | any> {
    this.setCache(idempotency, this.constants.RESPONSE_RECEIVED);
    return this.constants.RESPONSE_RECEIVED;
  }

  async setResponse(idempotency: string, response: any) {
    this.setCache(idempotency, response);
  }

  private async setCache(idempotency: string, response: any) {
    await this.cacheManager.set(
      idempotency,
      JSON.stringify(response),
      this.constants.TTL,
    );
  }
}
