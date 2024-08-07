import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';
import * as ipaddr from 'ipaddr.js';
import { SignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { Constants } from '@common/common/utils/pomelo.integration.process.constants';
import { HttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';

@Injectable()
export class SumsubSignatureGuard implements CanActivate {
  constructor(
    private readonly signatureUtil: SignatureUtils,
    private readonly constants: Constants,
    private readonly utils: HttpUtils,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    Logger.log(`Authorizing request.`, 'Sumsub Signature Guard');
    /* if (!this.checkSignatureIsNotExpired(headers.timestamp)) {
      throw new HttpException(this.constants.RESPONSE_SIGNATURE_EXPIRE, 401);
    } */
    const isValid = await this.signatureUtil.checkSignature(
      headers,
      context.switchToHttp().getRequest().body,
    );
    if (!isValid) {
      Logger.log(`Signing invalid signature response`, 'SignatureGuard');
      this.utils.setResponseHeaders(context);
      this.utils.signResponse(
        context,
        headers,
        PomeloEnum.POMELO_SIGNATURE_HEADER,
      );
      throw new HttpException(this.constants.RESPONSE_INVALID_SIGNATURE, 400);
    }
    return isValid;
    Logger.log('Not Authorized', 'SignatureGuard');
    return false;
  }

  private checkSignatureIsNotExpired(timestamp: number) {
    const currentTime: number = Date.now() / 1000;
    return currentTime - timestamp <= this.constants.TTL;
  }

  private headersToLowercase(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    for (const key in req.headers) {
      context.switchToHttp().getRequest().headers[key.toLowerCase()] =
        req.headers[key];
    }
  }
}
