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

export const serviceName = `${process.env.APP_NAME || 'B2crypto'}.${
  process.env.STACK || 'local'
}`;

const resource = new Resource({
  [ATTR_SERVICE_NAME]: serviceName,
  [ATTR_SERVICE_VERSION]: process.env.APP_VERSION || '1.0.0',
});

const tracesExporter = new OTLPTraceExporter();

const metricsExporter = new OTLPMetricExporter();

const logsExporter = new OTLPLogExporter();

export const sdk = new NodeSDK({
  resource,
  traceExporter: new tracing.ConsoleSpanExporter(),
  metricReader: new PeriodicExportingMetricReader({
    exporter: metricsExporter,
    exportIntervalMillis: 10000,
  }) as any,
  spanProcessors: [new tracing.BatchSpanProcessor(tracesExporter)],
  logRecordProcessors: [new logs.BatchLogRecordProcessor(logsExporter)],
  instrumentations: [getNodeAutoInstrumentations()],
});

process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .catch((error) => console.log('Error terminating tracing', error))
    .finally(() => process.exit(0));
});
