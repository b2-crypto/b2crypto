import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import {
  OPTL_OPEN_SEARCH_EBS_VOLUME_SIZE,
  OPTL_OPEN_SEARCH_INSTANCE_COUNT,
  OPTL_OPEN_SEARCH_INSTANCE_TYPE,
  OPTL_OPEN_SEARCH_ZONE_AWARENESS_AVAILABILITY_COUNT,
  OPTL_OPEN_SEARCH_ZONE_AWARENESS_ENABLED,
  PROJECT_NAME,
  SECRETS,
  STACK,
  TAGS,
} from '../../secrets';
import { ec2SecurityGroupOptlOpensearch } from './ec2.security-group';
import { ec2Vpc } from './ec2.vpc';

export const opensearchDomainOptl = new aws.opensearch.Domain(
  `${PROJECT_NAME}-optl-${STACK}`,
  {
    domainName: `${PROJECT_NAME}-optl-${STACK}`,
    engineVersion: 'OpenSearch_2.17',
    clusterConfig: {
      instanceType: OPTL_OPEN_SEARCH_INSTANCE_TYPE,
      instanceCount: OPTL_OPEN_SEARCH_INSTANCE_COUNT,
      zoneAwarenessEnabled: OPTL_OPEN_SEARCH_ZONE_AWARENESS_ENABLED,
      zoneAwarenessConfig: OPTL_OPEN_SEARCH_ZONE_AWARENESS_ENABLED
        ? {
            availabilityZoneCount:
              OPTL_OPEN_SEARCH_ZONE_AWARENESS_AVAILABILITY_COUNT,
          }
        : undefined,
    },
    ebsOptions: {
      ebsEnabled: true,
      volumeSize: OPTL_OPEN_SEARCH_EBS_VOLUME_SIZE,
      volumeType: 'gp2',
    },
    nodeToNodeEncryption: {
      enabled: true,
    },
    encryptAtRest: {
      enabled: true,
    },
    domainEndpointOptions: {
      enforceHttps: true,
      tlsSecurityPolicy: 'Policy-Min-TLS-1-2-2019-07',
    },
    vpcOptions: {
      subnetIds: ec2Vpc.privateSubnetIds.apply((subnets) =>
        OPTL_OPEN_SEARCH_INSTANCE_COUNT >= subnets.length
          ? subnets
          : subnets.slice(0, OPTL_OPEN_SEARCH_INSTANCE_COUNT),
      ),
      securityGroupIds: [ec2SecurityGroupOptlOpensearch.id],
    },
    advancedSecurityOptions: {
      enabled: true,
      internalUserDatabaseEnabled: true,
      masterUserOptions: {
        masterUserName: SECRETS.OPTL_OPEN_SEARCH_USERNAME,
        masterUserPassword: SECRETS.OPTL_OPEN_SEARCH_PASSWORD,
      },
    },
    accessPolicies: pulumi.jsonStringify({
      Version: '2012-10-17',
      Statement: [
        {
          Effect: 'Allow',
          Principal: {
            AWS: '*',
          },
          Action: 'es:*',
          Resource: aws
            .getCallerIdentityOutput()
            .accountId.apply(
              (value) =>
                `arn:aws:es:us-east-2:${value}:domain/${PROJECT_NAME}-optl-${STACK}/*`,
            ),
        },
      ],
    }),
    tags: TAGS,
  },
  {
    // protect: isProduction(),
  },
);
