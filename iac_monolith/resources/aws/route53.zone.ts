import * as aws from '@pulumi/aws';
import { DOMAIN } from '../../secrets';

export const route53Zone = aws.route53.getZoneOutput({ name: DOMAIN });
