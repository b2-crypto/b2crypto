import * as aws from '@pulumi/aws';
import { DOMAIN } from '../../secrets';

export const acmCertificate = aws.acm.getCertificateOutput({
  domain: DOMAIN,
});
