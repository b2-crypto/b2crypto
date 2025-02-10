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
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class PomeloSignatureGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(PomeloSignatureGuard.name)
    protected readonly logger: PinoLogger,
    private readonly signatureUtil: PomeloSignatureUtils,
    private readonly constants: PomeloProcessConstants,
    private readonly utils: PomeloHttpUtils,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.logger.info(`[canActivate] Checking signature`);
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    const path =
      this.reflector
        .get<string[]>(PATH_METADATA, context.getHandler())
        ?.toString() || '';
    this.logger.info(`[canActivate] Path: ${path}`);
    this.logger.info(`[canActivate] Headers: ${JSON.stringify(headers)}`);
    this.logger.info(
      `[canActivate] Check whitelisted ips: ${JSON.stringify(
        CommonService.checkWhitelistedIps(context),
      )}`,
    );
    this.logger.info(
      `[canActivate] Check valid endpoint: ${JSON.stringify(
        this.checkValidEndpoint(path, headers),
      )}`,
    );
    if (
      CommonService.checkWhitelistedIps(context) &&
      this.checkValidEndpoint(path, headers)
    ) {
      this.logger.info(`[canActivate] Valid endpoint`);
      if (
        path == PomeloEnum.POMELO_AUTHORIZATION_PATH.toString() &&
        !this.checkSignatureIsNotExpired(headers.timestamp)
      ) {
        throw new HttpException(
          this.constants.RESPONSE_SIGNATURE_EXPIRE,
          HttpStatus.UNAUTHORIZED,
        );
      }
      const isValid = await this.signatureUtil.checkSignature(
        headers,
        context.switchToHttp().getRequest().body,
      );
      if (!isValid) {
        this.logger.info(
          `[canActivate] Invalid signature: ${JSON.stringify(headers)}`,
        );
        this.utils.setResponseHeaders(context);
        this.utils.signResponse(
          context,
          headers,
          PomeloEnum.POMELO_SIGNATURE_HEADER,
        );
        throw new HttpException(
          this.constants.RESPONSE_INVALID_SIGNATURE,
          HttpStatus.BAD_REQUEST,
        );
      }
      return isValid;
    }
    this.logger.info(
      `[canActivate] Invalid signature: ${JSON.stringify(headers)}`,
    );
    return false;
  }

  private checkValidEndpoint(path: string, headers: ProcessHeaderDto): boolean {
    this.logger.info(`[checkValidEndpoint] Path: ${path}`);
    this.logger.info(
      `[checkValidEndpoint] Headers: ${JSON.stringify(headers)}`,
    );
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
