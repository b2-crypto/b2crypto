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
      },
    },
    customProps: (req: IncomingMessage) => ({
      correlationId: req.headers[CORRELATION_ID_HEADER],
    }),
    autoLogging: true,
    // serializers: {
    //   req: (data) => {
    //     const entriesBody = Object.entries(data?.body ?? {});
    //     const entriesBodySanitized = entriesBody.map(([key, value]) => {
    //       return /password|secret|key|token|apikey/i.test(key)
    //         ? [key, '********']
    //         : [key, value];
    //     });

    //     const bodySanitized = Object.fromEntries(entriesBodySanitized);

    //     return {
    //       ...data,
    //       body: bodySanitized,
    //       headers: {
    //         ...data.headers,
    //         [CORRELATION_ID_HEADER]: data.correlationId,
    //       },
    //     };
    //   },
    //   res: (data) => {
    //     const entriesBody = Object.entries(data?.body ?? {});
    //     const entriesBodySanitized = entriesBody.map(([key, value]) => {
    //       return /password|secret|key|token|apikey/i.test(key)
    //         ? [key, '********']
    //         : [key, value];
    //     });

    //     const bodySanitized = Object.fromEntries(entriesBodySanitized);

    //     return {
    //       ...data,
    //       body: bodySanitized,
    //       headers: {
    //         ...data.headers,
    //         [CORRELATION_ID_HEADER]: data.correlationId,
    //       },
    //     };
    //   },
    // },
  },
};
