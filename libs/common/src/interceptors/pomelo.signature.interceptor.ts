import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { SignatureUtils } from '../utils/pomelo.integration.process.signature';
import { HttpUtils } from '../utils/pomelo.integration.process.http.utils';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import { Reflector } from '@nestjs/core';
import { PATH_METADATA } from '@nestjs/common/constants';

@Injectable()
export class SignatureInterceptor implements NestInterceptor {
  constructor(
    private readonly signatureUtil: SignatureUtils,
    private readonly utils: HttpUtils,
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
    Logger.log(`Body to sign: ${JSON.stringify(data)}`, 'SignatureInterceptor');
    context
      .switchToHttp()
      .getResponse()
      .header(PomeloEnum.POMELO_SIGNATURE_HEADER, signature);
  }
}
