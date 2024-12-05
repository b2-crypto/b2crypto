import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
// import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { TracingConfig } from '@amplication/opentelemetry-nestjs';
import { CompositePropagator } from '@opentelemetry/core';
import { B3InjectEncoding, B3Propagator } from '@opentelemetry/propagator-b3';
import { JaegerPropagator } from '@opentelemetry/propagator-jaeger';
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-base';

const traceExporter = new OTLPTraceExporter({
  url: process.env.OPTL_API_URL,
});

export const tracingConfig = {
  serviceName: process.env.OPTL_SERVICE_NAME,
  spanProcessor: new BatchSpanProcessor(traceExporter) as any,
  traceExporter,
  textMapPropagator: new CompositePropagator({
    propagators: [
      new JaegerPropagator(),
      new B3Propagator(),
      new B3Propagator({
        injectEncoding: B3InjectEncoding.MULTI_HEADER,
      }),
    ],
  }),
  // metricReader: new PrometheusExporter({
  //   prefix: process.env.OPTL_SERVICE_NAME,
  //   endpoint: '/metrics',
  //   host: 'http://localhost',
  //   port: 8429,
  // }),
} satisfies TracingConfig;
