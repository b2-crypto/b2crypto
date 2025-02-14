import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { PeriodicExportingMetricReader } from '@opentelemetry/sdk-metrics';
import { logs, NodeSDK, tracing } from '@opentelemetry/sdk-node';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';

export const serviceName = `${process.env.APP_NAME || 'b2crypto'}.${process.env.STACK || 'dev'
  }`;

const resource = new Resource({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
});

const tracesExporter = new OTLPTraceExporter({
  headers: {
    'signoz-ingestion-key': process.env.OTLP_API_KEY || '',
  },
  url: process.env.OTLP_HOST_TRACES || 'http://localhost:4318/v1/traces',
});

const metricsExporter = new OTLPMetricExporter({
  headers: {
    'signoz-ingestion-key': process.env.OTLP_API_KEY || '',
  },
  url: process.env.OTLP_HOST_METRICS || 'http://localhost:4318/v1/metrics',
});

const logsExporter = new OTLPLogExporter({
  headers: {
    'signoz-ingestion-key': process.env.OTLP_API_KEY || '',
  },
  url: process.env.OTLP_HOST_LOGS || 'http://localhost:4318/v1/logs',
});

export const sdk = new NodeSDK({
  resource,
  traceExporter: new tracing.ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricsExporter,
    exportIntervalMillis: 10000,
  }) as any,
  spanProcessors: [
    new tracing.BatchSpanProcessor(tracesExporter),
    /*     new tracing.SimpleSpanProcessor(new tracing.ConsoleSpanExporter()), */
  ],
  logRecordProcessors: [new logs.BatchLogRecordProcessor(logsExporter)],
  instrumentations: [getNodeAutoInstrumentations()],
});

process.on('SIGTERM', async () => {
  await sdk
    .shutdown()
    .then(
      () => console.log('OpenTelemetry SDK shutdown complete'),
      (err) => console.log('OpenTelemetry SDK shutdown failed', err),
    )
    .finally(() => process.exit(0));
});
