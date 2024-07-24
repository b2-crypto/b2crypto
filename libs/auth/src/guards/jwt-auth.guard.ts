import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_ANON } from '../decorators/allow-anon.decorator';
import { IS_REFRESH } from '../decorators/refresh.decorator';
import { IS_API_KEY_CHECK } from '../decorators/api-key-check.decorator';
import { PATH_METADATA } from '@nestjs/common/constants';
import { HttpUtils } from '@common/common/utils/pomelo.integration.process.http.utils';
import * as ipaddr from 'ipaddr.js';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_ANON, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isRefresh = this.reflector.getAllAndOverride<boolean>(IS_REFRESH, [
      context.getHandler(),
      context.getClass(),
    ]);
    const isApiKeyCheck = this.reflector.getAllAndOverride<boolean>(
      IS_API_KEY_CHECK,
      [context.getHandler(), context.getClass()],
    );

    const incomingMessage = context['args'] && context['args'][0];
    if (
      isApiKeyCheck &&
      !!incomingMessage &&
      (incomingMessage?.headers['b2crypto-key'] || // User apiKey
        incomingMessage?.headers['b2crypto-affiliate-key'] || // Affiliate apiKey
        incomingMessage?.query['b2crypto-affiliate-key']) // Affiliate apiKey
    ) {
      incomingMessage.headers.checkApiKey = true;
    }
    if (
      isPublic ||
      isRefresh ||
      incomingMessage.headers.checkApiKey ||
      this.isRequestEncripted(context)
    ) {
      return true;
    }
    return super.canActivate(context);
  }

  private isRequestEncripted(context: ExecutionContext) {
    this.headersToLowercase(context);
    const path =
      this.reflector
        .get<string[]>(PATH_METADATA, context.getHandler())
        ?.toString() || '';
    //const headers = this.utils.extractRequestHeaders(context);
    const headers = this.extractRequestHeaders(context);
    if (
      this.checkWhitelistedIps(context) &&
      this.checkValidEndpoint(path, headers)
    ) {
      return true;
    }
    //return true;
    return false;
  }

  private checkValidEndpoint(path: string, headers: ProcessHeaderDto): boolean {
    if (path !== PomeloEnum.POMELO_ADJUSTMENT_PATH)
      return path === headers.endpoint;

    const adjustmentPath = path.replace('/:type', '');
    return headers.endpoint.includes(adjustmentPath);
  }
  private checkWhitelistedIps(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const caller =
      ipaddr.process(request?.connection?.remoteAddress).toString() ||
      request?.connection?.remoteAddress ||
      '';
    Logger.log(`IpCaller: ${caller}`, 'JwtAuthGuard');
    const whitelisted = process.env.POMELO_WHITELISTED_IPS;
    Logger.log(
      `Is allowed: ${whitelisted?.trim()?.split(',')}`,
      'JwtAuthGuard',
    );
    return (
      whitelisted?.replace(/\s/g, '')?.split(',')?.includes(caller) || false
    );
  }
  private headersToLowercase(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    for (const key in req.headers) {
      context.switchToHttp().getRequest().headers[key.toLowerCase()] =
        req.headers[key];
    }
  }

  private extractRequestHeaders(context: ExecutionContext): ProcessHeaderDto {
    const request = context.switchToHttp().getRequest();
    const headers: ProcessHeaderDto = {
      idempotency: request.headers[PomeloEnum.POMELO_IDEMPOTENCY_HEADER],
      apiKey: request.headers[PomeloEnum.POMELO_APIKEY_HEADER],
      signature: request.headers[PomeloEnum.POMELO_SIGNATURE_HEADER],
      timestamp: request.headers[PomeloEnum.POMELO_TIMESTAMP_HEADER],
      endpoint: request.headers[PomeloEnum.POMELO_ENDPOINT_HEADER],
    };
    if (!headers.idempotency) {
      headers.idempotency =
        context.switchToHttp().getRequest()?.body?.idempotency_key || '';
    }
    return headers;
  }
}
