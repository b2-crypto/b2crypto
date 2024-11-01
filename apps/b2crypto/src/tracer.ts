'use strict';

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import * as opentelemetry from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

export const tracerRun = async () => {
  const OPTL_API_URL = process.env['OPTL_API_URL'];
  const OPTL_SERVICE_NAME = process.env['OPTL_SERVICE_NAME'];

  if (typeof OPTL_API_URL !== 'string') {
    throw new Error('Missing env OPTL_API_URL');
  }

  if (typeof OPTL_SERVICE_NAME !== 'string') {
    throw new Error('Missing env OPTL_SERVICE_NAME');
  }

  const exporterOptions = {
    url: `${OPTL_API_URL}/v1/traces`,
  };

  const traceExporter = new OTLPTraceExporter(exporterOptions);

  const sdk = new opentelemetry.NodeSDK({
    traceExporter,
    instrumentations: [getNodeAutoInstrumentations()],
    resource: new Resource({
      [ATTR_SERVICE_NAME]: OPTL_SERVICE_NAME,
    }),
  });

  sdk.start();

  console.log('=====================================');
  console.log('Tracing started', OPTL_API_URL);
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
