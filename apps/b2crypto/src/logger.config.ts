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
  },
};
