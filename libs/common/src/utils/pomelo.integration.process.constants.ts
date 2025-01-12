import { Injectable } from '@nestjs/common';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class PomeloProcessConstants {
  public readonly TTL: number = 60;

  public readonly RESPONSE_TOO_EARLY = {
    statusCode: 425,
    body: null,
  };

  public readonly RESPONSE_INVALID_SIGNATURE = {
    statusCode: 400,
    body: {
      STATUS: 'BAD_SIGNATURE',
    },
  };

  public readonly RESPONSE_RECEIVED = {
    statusCode: 204,
    body: null,
  };

  public readonly RESPONSE_SIGNATURE_EXPIRE = {
    statusCode: 401,
    body: {
      STATUS: 'Transaction has expired',
    },
  };
}
