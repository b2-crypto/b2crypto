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
      Logger.log(`Headers: ${JSON.stringify(headers)}`, 'Check Signature');
      let signature = headers.signature;
      if (headers.signature.startsWith('hmac-sha256')) {
        signature = signature.replace('hmac-sha256 ', '');
      } else {
        Logger.error(
          `Unsupported signature algorithm, expecting hmac-sha256, got ${signature}`,
          'Check Signature',
        );
        const response = await this.cache.setInvalidSignature(
          headers.idempotency,
        );
        return false;
      }

      const rawBody = Buffer.from(JSON.stringify(body));
      const signatureString = JSON.stringify(this.API_DIC[headers.apiKey]);
      const rawSignature = Buffer.from(signatureString, 'base64');

      const hmac = crypto
        .createHmac('sha256', rawSignature)
        .update(headers.timestamp.toString())
        .update(headers.endpoint)
        .update(rawBody);

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
          'Check Signature',
        );
        return true;
      }
      return true;
    }
    return true;
  }

  signResponse(headers: ProcessHeaderDto, body?: any): string {
    const secret = JSON.stringify(this.API_DIC[headers.apiKey]);
    const key = Buffer.from(secret, 'base64');
    const hash = crypto
      .createHmac('sha256', key)
      .update(headers.timestamp.toString())
      .update(headers.endpoint);

    let message = '';
    if (body) {
      body = this.fixResponseBody(body);
      Logger.log(JSON.stringify(body), 'SignResponse');
      hash.update(Buffer.from(JSON.stringify(body)));
      message = `${headers.timestamp}${headers.endpoint}${JSON.stringify(
        body,
      )}`;
    } else {
      message = `${headers.timestamp}${headers.endpoint}`;
    }
    Logger.log(`Message: ${message}`, 'SignResponse');

    const hashResult = hash.digest('base64'); // calculated signature result
    return 'hmac-sha256 ' + hashResult;
  }

  private fixResponseBody(data: any): any {
    let body = data?.data || data;
    while (body.data) {
      body = body.data || body;
    }
    return body;
  }
}
