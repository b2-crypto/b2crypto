import { CacheInterceptor, ExecutionContext } from '@nestjs/common';

export class B2CryptoCacheInterceptor extends CacheInterceptor {
  protected isRequestCacheable(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const request = http.getRequest();

    const ignoreCaching: boolean = this.reflector.get(
      'ignoreCaching',
      context.getHandler(),
    );

    return !ignoreCaching || request.method === 'GET';
  }
}
