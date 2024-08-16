import { ProcessBodyI } from '@integration/integration/dto/pomelo.process.body.dto';
import { ProcessHeaderDto } from '@integration/integration/dto/pomelo.process.header.dto';
import { PomeloCache } from '@integration/integration/util/pomelo.integration.process.cache';
import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PomeloSignatureUtils {
  private API_DIC = JSON.parse(process.env.POMELO_SIGNATURE_SECRET_KEY_DIC);

  constructor(private readonly cache: PomeloCache) {}

  async checkSignature(
    headers: ProcessHeaderDto,
    body: ProcessBodyI,
  ): Promise<boolean> {
    try {
      if (headers && body) {
        Logger.log(
          `Headers: ${JSON.stringify(headers)}`,
          'Pomelo Check Signature',
        );
        let signature = headers.signature;
        if (headers.signature.startsWith('hmac-sha256')) {
          signature = signature.replace('hmac-sha256 ', '');

          const secret = JSON.stringify(this.API_DIC[headers.apiKey]);
          const key = Buffer.from(secret, 'base64');

          const hmac = crypto
            .createHmac('sha256', key)
            .update('' + headers.timestamp)
            .update(headers.endpoint)
            .update(Buffer.from(JSON.stringify(body)));

          const hashResult = hmac.digest('base64'); // calculated signature result
          const hashResultBytes = Buffer.from(hashResult, 'base64'); // bytes representation

          // compare signatures using a cryptographically secure function
          // for that you normally need the signature bytes, so decode from base64
          const signatureBytes = Buffer.from(signature, 'base64');
          const signaturesMatch = crypto.timingSafeEqual(
            hashResultBytes,
            signatureBytes,
          );

          if (!signaturesMatch) {
            Logger.error(
              `Signature mismatch. Received: ${signature}. Calculated: ${hashResult}`,
              'Pomelo Check Signature',
            );
            return false;
          }
          return true;
        } else {
          Logger.error(
            `Unsupported signature algorithm, expecting hmac-sha256, got ${signature}`,
            'Pomelo Check Signature',
          );
          const response = await this.cache.setInvalidSignature(
            headers.idempotency,
          );
          return false;
        }
      }
    } catch (error) {
      Logger.error(error, 'Pomelo Check Signature');
      return false;
    }
    return false;
  }

  signResponse(headers: ProcessHeaderDto, body?: any): string {
    try {
      const secret = JSON.stringify(this.API_DIC[headers.apiKey]);
      const key = Buffer.from(secret, 'base64');
      const hash = crypto
        .createHmac('sha256', key)
        .update(headers.timestamp.toString())
        .update(headers.endpoint);

      if (body) {
        body = this.fixResponseBody(body);
        hash.update(Buffer.from(JSON.stringify(body)));
      }

      const hashResult = hash.digest('base64');
      return 'hmac-sha256 ' + hashResult;
    } catch (error) {
      Logger.error(error);
      return '';
    }
  }

  private fixResponseBody(data: any): any {
    let body = data?.data || data;
    while (body.data) {
      body = body.data || body;
    }
    return body;
  }
}
