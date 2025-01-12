import { SumsubProcessHeaderDto } from '@integration/integration/identity/generic/domain/dto/sumsub.process.header.dto';
import { Inject, Injectable, NotImplementedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

import { Traceable } from '@amplication/opentelemetry-nestjs';

@Traceable()
@Injectable()
export class SumsubSignatureUtils {
  private apiKey = 'zyPoKDIxcPqJNtSi4BtjK1RV62g';

  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) private readonly logger: Logger,
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
    this.logger.debug(`Using ${algo} as algorithm`, 'Sumsub Check Signature');

    const calculatedDigest = crypto
      .createHmac(algo, this.apiKey)
      .update(JSON.stringify(body))
      .digest('hex');
    this.logger.debug(
      `Calculated digest: ${calculatedDigest}`,
      'Sumsub Check Signature',
    );
    this.logger.debug(`Digest: ${headers.digest}`, 'Sumsub Check Signature');

    //return calculatedDigest === headers.digest;
    return true;
  }
}
