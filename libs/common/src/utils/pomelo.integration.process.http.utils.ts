import { ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { PomeloSignatureUtils } from './pomelo.integration.process.signature';
import { PomeloProcessConstants } from './pomelo.integration.process.constants';
import { PomeloEnum } from '@integration/integration/enum/pomelo.enum';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';

@Injectable()
export class PomeloHttpUtils {
  constructor(
    private readonly signatureUtil: PomeloSignatureUtils,
    private readonly constants: PomeloProcessConstants,
  ) {}

  setResponseHeaders(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    for (const key in req.headers) {
      context
        .switchToHttp()
        .getResponse()
        .header(key.toLowerCase(), req.headers[key]);
    }
    context
      .switchToHttp()
      .getResponse()
      .header(
        PomeloEnum.POMELO_TIMESTAMP_HEADER,
        Math.floor(Date.now() / 1000),
      );
  }

  extractRequestHeaders(context: ExecutionContext): ProcessHeaderDto {
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

  extractResponseHeaders(context: ExecutionContext): ProcessHeaderDto {
    const response = context.switchToHttp().getResponse();
    response.headers = response.headers ?? response._headers;
    const headers: ProcessHeaderDto = {
      idempotency: response.headers[PomeloEnum.POMELO_IDEMPOTENCY_HEADER],
      apiKey: response.headers[PomeloEnum.POMELO_APIKEY_HEADER],
      signature: response.headers[PomeloEnum.POMELO_SIGNATURE_HEADER],
      timestamp: response.headers[PomeloEnum.POMELO_TIMESTAMP_HEADER],
      endpoint: response.headers[PomeloEnum.POMELO_ENDPOINT_HEADER],
    };
    return headers;
  }

  public signResponse(
    context: ExecutionContext,
    headers: ProcessHeaderDto,
    body?: any,
  ) {
    context
      .switchToHttp()
      .getResponse()
      .header(
        body,
        this.signatureUtil.signResponse(
          headers,
          this.constants.RESPONSE_INVALID_SIGNATURE,
        ),
      );
  }
}
