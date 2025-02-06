import { CacheInterceptor } from '@nestjs/cache-manager';
import { ExecutionContext } from '@nestjs/common';
import * as crypto from 'crypto';

export class B2CryptoCacheInterceptor extends CacheInterceptor {
  isRequestCacheable(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();

    const ignoreCaching: boolean = this.reflector.get(
      'ignoreCaching',
      context.getHandler(),
    );
    const req = context.switchToHttp().getRequest();
    return (
      !ignoreCaching ||
      !!req.headers['authorization'] ||
      request.method === 'GET'
    );
  }

  trackBy(context: ExecutionContext): string | undefined {
    const req = context.switchToHttp().getRequest();
    const bearerToken = req.headers['authorization'];
    const body = JSON.stringify(req.body);
    const url = req.url;
    const method = req.method;
    const ip = req.ip;
    const params = JSON.stringify(req.params);
    const query = JSON.stringify(req.query);
    const userId = req.user?.id ?? 'anonymous-user';
    const clientId = req.clientApi ?? 'anonymous-client';

    const key = `${bearerToken}${body}${url}${method}${ip}${params}${query}${userId}${clientId}`;
    const hash = crypto.createHash('sha256').update(key).digest('hex');
    return hash;
  }
}
