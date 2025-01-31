import { Traceable } from '@amplication/opentelemetry-nestjs';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PATH_METADATA } from '@nestjs/common/constants';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { PomeloHttpUtils } from '../utils/pomelo.integration.process.http.utils';
import { PomeloSignatureUtils } from '../utils/pomelo.integration.process.signature';

@Traceable()
@Injectable()
export class PomeloSignatureInterceptor implements NestInterceptor {
  constructor(
    private readonly signatureUtil: PomeloSignatureUtils,
    private readonly utils: PomeloHttpUtils,
    private readonly reflector: Reflector,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    return next.handle().pipe(
      map((data) => ({ data })),
      tap((data) => {
        this.utils.setResponseHeaders(context);
        const headers = this.utils.extractResponseHeaders(context);
        this.signResponse(context, headers, data);
      }),
    );
  }

  private signResponse(
    context: ExecutionContext,
    headers: ProcessHeaderDto,
    data?: any,
  ) {
    const path =
      this.reflector
        .get<string[]>(PATH_METADATA, context.getHandler())
        ?.toString() || '';
    const signature =
      PomeloEnum.POMELO_AUTHORIZATION_PATH === path
        ? this.signatureUtil.signResponse(headers, data)
        : this.signatureUtil.signResponse(headers);
    context
      .switchToHttp()
      .getResponse()
      .header(PomeloEnum.POMELO_SIGNATURE_HEADER, signature);
  }
}
