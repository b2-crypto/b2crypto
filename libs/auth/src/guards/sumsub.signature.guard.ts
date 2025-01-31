import { Traceable } from '@amplication/opentelemetry-nestjs';
import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class SumsubSignatureGuard implements CanActivate {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly signatureUtil: SumsubSignatureUtils,
    private readonly constants: PomeloProcessConstants,
    private readonly utils: SumsubHttpUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    this.logger.debug(`Authorizing request.`, 'Sumsub Signature Guard');
    const request = context.switchToHttp().getRequest();
    const isValid = await this.signatureUtil.checkSignature(
      headers,
      request.body,
    );
    if (!isValid) {
      this.logger.debug(`Signing invalid signature response`, 'SignatureGuard');
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
