import { ProcessBodyI } from '@integration/integration/dto/pomelo.process.body.dto';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class SignatureUtils {
  private API_DIC = JSON.parse(process.env.API_SECRET_KEY_DIC);

  constructor(private readonly cache: PomeloCache) {}

  async checkSignature(
    headers: ProcessHeaderDto,
    body: ProcessBodyI,
  ): Promise<boolean> {
    if (headers && body) {
      Logger.log('Check Signature', `Headers: ${JSON.stringify(headers)}`);
      let signature = headers.signature;
      if (headers.signature.startsWith('hmac-sha256')) {
        signature = signature.replace('hmac-sha256 ', '');
      } else {
        Logger.error(
          'Check Signature',
          `Unsupported signature algorithm, expecting hmac-sha256, got ${signature}`,
        );
        const response = await this.cache.setInvalidSignature(
          headers.idempotency,
        );
        return false;
      }

      let rawBody = Buffer.from(JSON.stringify(body));
      const signatureString = JSON.stringify(this.API_DIC[headers.apiKey]);
      let rawSignature = Buffer.from(signatureString, 'base64');

      let hmac = crypto
        .createHmac('sha256', rawSignature)
        .update(headers.timestamp.toString())
        .update(headers.endpoint)
        .update(rawBody);

      let hashResult = hmac.digest('base64'); // calculated signature result
      let hashResultBytes = Buffer.from(hashResult, 'base64'); // bytes representation

      // compare signatures using a cryptographically secure function
      // for that you normally need the signature bytes, so decode from base64
      const signatureBytes = Buffer.from(signature, 'base64');
      const signaturesMatch = crypto.timingSafeEqual(
        hashResultBytes,
        signatureBytes,
      );

      if (!signaturesMatch) {
        Logger.error(
          'Check Signature',
          `Signature mismatch. Received: ${signature}. Calculated: ${hashResult}`,
        );
        return true;
      }
    }
    return true;
  }

  signResponse(headers: ProcessHeaderDto, body: any): string {
    const signatureString = JSON.stringify(this.API_DIC[headers.apiKey]);
    const hash = crypto
      .createHmac('sha256', signatureString)
      .update(headers.timestamp.toString())
      .update(headers.endpoint);
    hash.update(Buffer.from(JSON.stringify(body)));

    let hashResult = hash.digest('base64'); // calculated signature result
    return 'hmac-sha256 ' + hashResult;
  }
}
