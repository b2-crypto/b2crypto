import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { ResponseB2CryptoService } from '@response-b2crypto/response-b2crypto';
import ResponseB2Crypto from '@response-b2crypto/response-b2crypto/models/ResponseB2Crypto';
import { Response } from 'express';

@Catch()
export class ResponseHttpExceptionFilter implements ExceptionFilter {
  constructor(private responseB2Crypto: ResponseB2CryptoService) {}

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    //const request = ctx.getRequest<Request>();
    const rta = new ResponseB2Crypto(
      process.env.ENVIRONMENT || 'DEV',
      exception.response || exception,
    ).getResponse();
    if (ctx['contextType'] == 'rpc') {
      ctx.getNext();
    } else {
      //rta.data = rta.data ?? {};
      //rta.data.message = rta.description ?? rta.data?.message;
      response
        .status(this.getStatus(rta, exception))
        .json(rta.data?.description ? rta.data : rta);
    }
  }

  private getStatus(rta, exception) {
    return typeof rta?.statusCode === 'string'
      ? exception.status
      : rta?.statusCode ?? 500;
  }
}
