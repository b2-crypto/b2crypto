import { CORRELATION_ID_HEADER } from '@common/common/middlewares';
import { IncomingMessage } from 'http';
import { serviceName } from './opentelemetry';

export const loggerConfig = {
  pinoHttp: {
    transport: {
      targets: [
        {
          target: 'pino-pretty',
          options: { colorize: true },
        },
        {
          target: 'pino-opentelemetry-transport',
          options: {
            resourceAttributes: {
              'service.name': serviceName,
            },
          },
        },
      ],
      options: {
        prettyPrint: true,
        level: 'trace',
        format: 'json',
      },
    },
    customProps: (req: IncomingMessage) => ({
      correlationId: req.headers[CORRELATION_ID_HEADER],
    }),
    autoLogging: true,
  },
};
