import { Traceable } from '@amplication/opentelemetry-nestjs';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class SumsubSignatureGuard implements CanActivate {
  constructor(
    @InjectPinoLogger(SumsubSignatureGuard.name)
    protected readonly logger: PinoLogger,
    private readonly signatureUtil: SumsubSignatureUtils,
    private readonly constants: PomeloProcessConstants,
    private readonly utils: SumsubHttpUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    this.logger.info(`Authorizing request.`, 'Sumsub Signature Guard');
    const request = context.switchToHttp().getRequest();
    const isValid = await this.signatureUtil.checkSignature(
      headers,
      request.body,
    );
    if (!isValid) {
      this.logger.info(`Signing invalid signature response`, 'SignatureGuard');
      throw new HttpException(this.constants.RESPONSE_INVALID_SIGNATURE, 400);
    }
    return isValid;
  }

  private headersToLowercase(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    for (const key in req.headers) {
      context.switchToHttp().getRequest().headers[key.toLowerCase()] =
        req.headers[key];
    }
  }
}
