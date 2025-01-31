import { Traceable } from '@amplication/opentelemetry-nestjs';
import { CommonService } from '@common/common';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { PomeloHttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from '@common/common/utils/pomelo.integration.process.signature';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class PomeloSignatureGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly signatureUtil: PomeloSignatureUtils,
    private readonly constants: PomeloProcessConstants,
    private readonly utils: PomeloHttpUtils,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.debug('Checking Pomelo signature', 'PomeloSignatureGuard');
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    const path =
      this.reflector
        .get<string[]>(PATH_METADATA, context.getHandler())
        ?.toString() || '';
    this.logger.debug(`Path: ${path}`, 'SignatureGuard');
    this.logger.debug(
      `Headers endpoint: ${JSON.stringify(headers.endpoint)}`,
      'SignatureGuard',
    );
    this.logger.debug(
      'checkWhitelistedIps',
      CommonService.checkWhitelistedIps(context),
    );
    this.logger.debug(
      'checkValidEndpoint',
      this.checkValidEndpoint(path, headers),
    );
    if (
      CommonService.checkWhitelistedIps(context) &&
      this.checkValidEndpoint(path, headers)
    ) {
      this.logger.debug(`Authorizing request.`, 'SignatureGuard');
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
        this.logger.debug(
          `Signing invalid signature response`,
          'SignatureGuard',
        );
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
    this.logger.debug('Not Authorized', 'SignatureGuard');
    return false;
  }

  private checkValidEndpoint(path: string, headers: ProcessHeaderDto): boolean {
    this.logger.debug('Check valid endpoint', 'checkValidEndpoint');
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
