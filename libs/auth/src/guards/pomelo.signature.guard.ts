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
export class SignatureGuard implements CanActivate {
  constructor(
    private readonly signatureUtil: SignatureUtils,
    private readonly constants: Constants,
    private readonly utils: HttpUtils,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    const path =
      this.reflector
        .get<string[]>(PATH_METADATA, context.getHandler())
        ?.toString() || '';
    if (
      this.checkWhitelistedIps(context) &&
      this.checkValidEndpoint(path, headers)
    ) {
      Logger.log(`Authorizing request.`, 'SignatureGuard');
      if (
        path == PomeloEnum.POMELO_AUTHORIZATION_PATH.toString() &&
        !this.checkSignatureIsNotExpired(headers.timestamp)
      ) {
        throw new HttpException(this.constants.RESPONSE_SIGNATURE_EXPIRE, 401);
      }
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
    }
    Logger.log('Not Authorized', 'SignatureGuard');
    return false;
  }

  private checkWhitelistedIps(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const caller =
      ipaddr.process(request?.connection?.remoteAddress).toString() ||
      request?.connection?.remoteAddress ||
      '';
    Logger.log(`IpCaller: ${caller}`, 'SignatureGuard');
    //const whitelisted = process.env.POMELO_WHITELISTED_IPS;
    //return whitelisted?.replace(/\s/g, '')?.split(',')?.includes(caller) || false;
    return true;
  }

  private checkValidEndpoint(path: string, headers: ProcessHeaderDto): boolean {
    if (path !== PomeloEnum.POMELO_ADJUSTMENT_PATH)
      return path === headers.endpoint;

    const adjustmentPath = path.replace('/:type', '');
    return headers.endpoint.includes(adjustmentPath);
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
