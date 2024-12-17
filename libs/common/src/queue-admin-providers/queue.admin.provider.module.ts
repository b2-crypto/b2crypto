import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ClientProvider,
  ClientProxyFactory,
  ClientsModule,
  Transport,
} from '@nestjs/microservices';
import { QueueAdminService } from './queue.admin.provider.service';
//let portsMap = {};
@Module({
  providers: [QueueAdminService],
  exports: [QueueAdminService],
})
export class QueueAdminModule {
  static register({ name, queueName }: QueueAdminModuleOptions): DynamicModule {
    return {
      module: QueueAdminModule,
      imports: [
        ClientsModule.registerAsync([
          {
            name,
            useFactory: (configService: ConfigService) => {
              return QueueAdminModule.getClientProvider(
                configService,
                queueName,
              );
            },
            inject: [ConfigService],
          },
        ]),
      ],
      exports: [ClientsModule],
    };
  }

  static factoryEventClient(name: string) {
    return async (configService: ConfigService) => {
      const clientOptions = await QueueAdminModule.getClientProvider(
        configService,
        name,
      );
      return ClientProxyFactory.create(clientOptions);
    };
  }

  static async getClientProvider(
    configService: ConfigService,
    queueName = null,
    noAck = true,
  ): Promise<ClientProvider> {
    queueName = null;
    const host = configService.get<string>('RABBIT_MQ_HOST');
    const opts = {
      username: configService.get<string>('RABBIT_MQ_USERNAME'),
      password: configService.get<string>('RABBIT_MQ_PASSWORD'),
      host: host,
      port: configService.get<string>('RABBIT_MQ_PORT'),
      //queue: configService.get<string>(`RMQ_${name}_QUEUE`),
      queue: queueName ?? configService.get<string>('RABBIT_MQ_QUEUE'),
      //queue: 'DEV',
      protocol: host === 'localhost' ? 'amqp' : 'amqps',
    };
    return {
      transport: Transport.RMQ,
      options: {
        urls: [
          `${opts.protocol}://${opts.username}:${opts.password}@${opts.host}:${opts.port}/`,
        ],
        queue: opts.queue,
        persistent: true,
        noAck,
        queueOptions: {
          durable: false,
        },
      },
    };
  }
}

interface QueueAdminModuleOptions {
  name: string;
  queueName: string;
}
