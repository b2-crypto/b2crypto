import { Traceable } from '@amplication/opentelemetry-nestjs';
import ActionsEnum from '@common/common/enums/ActionEnum';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ResponseB2Crypto from './models/ResponseB2Crypto';

@Traceable()
@Injectable()
export class ResponseB2CryptoService {
  constructor(private readonly config: ConfigService) {}

  getErrorResponse(err: any, action?: ActionsEnum): BadRequestException {
    return new ResponseB2Crypto(
      this.config.get('ENVIRONMENT'),
      err,
      action,
    ).getErrorResponse();
  }

  getResponse(
    rta: any,
    action?: ActionsEnum,
    message?: string,
    description?: string,
  ): any {
    return new ResponseB2Crypto(
      this.config.get('ENVIRONMENT'),
      rta,
      action,
    ).getResponse(message, description);
  }
}
