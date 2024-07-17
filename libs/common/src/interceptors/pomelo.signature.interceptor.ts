import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ProcessHeaderDto } from 'apps/integration-service/src/dto/pomelo.process.header.dto';
import { PomeloEnum } from 'apps/integration-service/src/enum/pomelo.enum';
import { HttpUtils } from 'apps/integration-service/src/utils/pomelo.integration.process.http.utils';
import { SignatureUtils } from 'apps/integration-service/src/utils/pomelo.integration.process.signature';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

@Injectable()
export class SignatureInterceptor implements NestInterceptor {
  constructor(
    private readonly signatureUtil: SignatureUtils,
    private readonly utils: HttpUtils,
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
    data: any,
  ) {
    context
      .switchToHttp()
      .getResponse()
      .header(
        PomeloEnum.POMELO_SIGNATURE_HEADER,
        this.signatureUtil.signResponse(headers, data),
      );
  }
}
