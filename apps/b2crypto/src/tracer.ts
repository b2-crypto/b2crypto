'use strict';

import { ConfigService } from '@nestjs/config';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export const tracerRun = async (configService: ConfigService) => {
  const exporterOptions = {
    url: `${configService.getOrThrow('OPTL_API_URL')}/v1/traces`,
  };

  const traceExporter = new OTLPTraceExporter(exporterOptions);

  const sdk = new opentelemetry.NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
    resource: new Resource({
      [ATTR_SERVICE_NAME]: configService.getOrThrow('OPTL_SERVICE_NAME'),
    }),
  });

  sdk.start();

  console.log('=====================================');
  console.log('Tracing started', configService.getOrThrow('OPTL_API_URL'));
  console.log('=====================================');

  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => {
        console.log('=====================================');
        console.log('Tracing terminated');
        console.log('=====================================');
      })
      .catch((error) => {
        console.log('=====================================');
        console.log('Error terminating tracing', error);
        console.log('=====================================');
      })
      .finally(() => process.exit(0));
  });
};
