import { PomeloProcessConstants } from '@common/common/utils/pomelo.integration.process.constants';
import { SumsubHttpUtils } from '@common/common/utils/sumsub.integration.process.http.utils';
import { SumsubSignatureUtils } from '@common/common/utils/sumsub.integration.process.signature';
import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
} from '@nestjs/common';

@Injectable()
export class SumsubSignatureGuard implements CanActivate {
  constructor(
    private readonly signatureUtil: SumsubSignatureUtils,
    private readonly constants: PomeloProcessConstants,
    private readonly utils: SumsubHttpUtils,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    this.headersToLowercase(context);
    const headers = this.utils.extractRequestHeaders(context);
    Logger.log(`Authorizing request.`, 'Sumsub Signature Guard');
    const request = context.switchToHttp().getRequest();
    const isValid = await this.signatureUtil.checkSignature(
      headers,
      request.body,
    );
    if (!isValid) {
      Logger.log(`Signing invalid signature response`, 'SignatureGuard');
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
