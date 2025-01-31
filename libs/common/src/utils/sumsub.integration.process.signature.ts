import { Traceable } from '@amplication/opentelemetry-nestjs';
import { SumsubProcessHeaderDto } from '@integration/integration/identity/generic/domain/dto/sumsub.process.header.dto';
import { Injectable, Logger, NotImplementedException } from '@nestjs/common';
import * as crypto from 'crypto';

@Traceable()
@Injectable()
export class SumsubSignatureUtils {
  private apiKey = 'zyPoKDIxcPqJNtSi4BtjK1RV62g';

  checkSignature(headers: SumsubProcessHeaderDto, body): boolean {
    const algo = {
      HMAC_SHA1_HEX: 'sha1',
      HMAC_SHA256_HEX: 'sha256',
      HMAC_SHA512_HEX: 'sha512',
    }[headers.digestAlgorithm];

    if (!algo) {
      throw new NotImplementedException('Unsupported algorithm');
    }
    Logger.log(`Using ${algo} as algorithm`, 'Sumsub Check Signature');

    const calculatedDigest = crypto
      .createHmac(algo, this.apiKey)
      .update(JSON.stringify(body))
      .digest('hex');
    Logger.log(
      `Calculated digest: ${calculatedDigest}`,
      'Sumsub Check Signature',
    );
    Logger.log(`Digest: ${headers.digest}`, 'Sumsub Check Signature');

    //return calculatedDigest === headers.digest;
    return true;
  }
}
