import { Traceable } from '@amplication/opentelemetry-nestjs';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import * as ipaddr from 'ipaddr.js';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AppAbility, CaslAbilityFactory } from '../casl-ability.factory';
import { IS_ANON } from '../decorators/allow-anon.decorator';
import { IS_API_KEY_CHECK } from '../decorators/api-key-check.decorator';
import { IS_REFRESH } from '../decorators/refresh.decorator';
import {
  CHECK_POLICIES_ABILITY_KEY,
  PolicyHandler,
} from '../policy/policy.handler.ability';

@Traceable()
@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(PoliciesGuard.name)
    protected readonly logger: PinoLogger,
    private reflector: Reflector,
    private caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      (incomingMessage?.headers['b2crypto-key'] ||
        incomingMessage?.headers['b2crypto-affiliate-key'])
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
    const policyHandlers =
      this.reflector.get<PolicyHandler[]>(
        CHECK_POLICIES_ABILITY_KEY,
        context.getHandler(),
      ) || [];

    const { user } = context.switchToHttp().getRequest();
    const ability = await this.caslAbilityFactory.createForUser(user);

    return policyHandlers.every((handler) =>
      this.execPolicyHandler(handler, ability as AppAbility),
    );
  }

  private execPolicyHandler(handler: PolicyHandler, ability: AppAbility) {
    if (typeof handler === 'function') {
      return handler(ability);
    }
    return handler.handle(ability);
  }

  private isRequestEncripted(context: ExecutionContext) {
    this.headersToLowercase(context);
    const path =
      this.reflector
        .get<string[]>(PATH_METADATA, context.getHandler())
        ?.toString() || '';
    //const headers = this.utils.extractRequestHeaders(context);
    const headers = this.extractRequestHeaders(context);
    /* if (
      this.checkWhitelistedIps(context) &&
      this.checkValidEndpoint(path, headers)
    ) {
      return true;
      } */
    return true;
    //return false;
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
    this.logger.debug('SignatureGuard', `IpCaller: ${caller}`);
    const whitelisted = process.env.POMELO_WHITELISTED_IPS;
    return whitelisted?.split(',')?.includes(caller) || false;
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
