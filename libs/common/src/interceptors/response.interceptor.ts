import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import {
  BadGatewayException,
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { ResponseB2CryptoService } from '@response-b2crypto/response-b2crypto';
import { isArray, isNumber, isString } from 'class-validator';
import { catchError, map, Observable, throwError } from 'rxjs';

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  constructor(private responseB2Crypto: ResponseB2CryptoService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler<any>,
  ): Observable<any> | Promise<Observable<any>> {
    const [req, res] = context.getArgs();
    // req.ip
    // req.ips
    // req.method
    // req.originalUrl
    // req.route
    // res.statusCode

    return next.handle().pipe(
      map((data) => {
        if (this.checkPomeloHooksResponse(res)) {
          return data?.data || data;
        }
        if (context['contextType'] === 'rpc') {
          return data;
        }
        if (!!data) {
          data.statusCode = this.getStatusCode(data, res);
          if (isString(data.status)) {
            delete data.status;
          }
          res.status(data?.statusCode ?? 500);
          return this.responseB2Crypto.getResponse(data);
        }
        return data;
      }),
      catchError(this.catchError(context['contextType'])),
    );
  }

  private checkPomeloHooksResponse(res): boolean {
    try {
      return res.headers[PomeloEnum.POMELO_APIKEY_HEADER] || false;
    } catch (error) {}
    return false;
  }

  private getStatusCode(data, res) {
    // TODO[hender - 2024/07/22] Check double request
    const statusCode = data.statusCode ?? data.data?.statusCode;
    return (
      statusCode ??
      (data.access_token ||
      data.id ||
      data._id ||
      isArray(data.list) ||
      isArray(data)
        ? 201
        : !!data.response
        ? data.response?.statusCode
        : isNumber(res.status)
        ? res.status
        : 400)
    );
  }

  private catchError(contextType: string) {
    return (err) => {
      return throwError(() => {
        if (contextType === 'rpc') {
          return new RpcException(err);
        }
        return err;
      });
    };
  }
}
