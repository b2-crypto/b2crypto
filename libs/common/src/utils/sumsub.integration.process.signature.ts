import { SumsubProcessHeaderDto } from '@integration/integration/identity/generic/domain/dto/sumsub.process.header.dto';
import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

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
      throw new Error('Unsupported algorithm');
    }

    const calculatedDigest = crypto
      .createHmac(algo, this.apiKey)
      .update(JSON.stringify(body))
      .digest('hex');

    return calculatedDigest === headers.digest;
  }
}
