import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_ANON } from '../decorators/allow-anon.decorator';
import { IS_REFRESH } from '../decorators/refresh.decorator';
import { IS_API_KEY_CHECK } from '../decorators/api-key-check.decorator';

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
    if (isPublic || isRefresh || incomingMessage.headers.checkApiKey) {
      return true;
    }
    return super.canActivate(context);
  }
}
