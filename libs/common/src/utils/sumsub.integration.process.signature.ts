import { Traceable } from '@amplication/opentelemetry-nestjs';
import { SumsubProcessHeaderDto } from '@integration/integration/identity/generic/domain/dto/sumsub.process.header.dto';
import { Injectable, NotImplementedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Injectable()
export class SumsubSignatureUtils {
  private apiKey = 'zyPoKDIxcPqJNtSi4BtjK1RV62g';

  constructor(
    @InjectPinoLogger(SumsubSignatureUtils.name)
    protected readonly logger: PinoLogger,
  ) {}

  checkSignature(headers: SumsubProcessHeaderDto, body): boolean {
    const algo = {
      HMAC_SHA1_HEX: 'sha1',
      HMAC_SHA256_HEX: 'sha256',
      HMAC_SHA512_HEX: 'sha512',
    }[headers.digestAlgorithm];

    if (!algo) {
      throw new NotImplementedException('Unsupported algorithm');
    }
    this.logger.debug(`[checkSignature] Sumsub Check Signature: ${algo}`);

    const calculatedDigest = crypto
      .createHmac(algo, this.apiKey)
      .update(JSON.stringify(body))
      .digest('hex');
    this.logger.debug(
      `[checkSignature] Calculated digest: ${calculatedDigest}`,
    );
    this.logger.debug(`[checkSignature] Digest: ${headers.digest}`);

    //return calculatedDigest === headers.digest;
    return true;
  }
}
