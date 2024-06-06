import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RmqContext } from '@nestjs/microservices';
import { QueueAdminModule } from './queue.admin.provider.module';

@Injectable()
export class QueueAdminService {
  constructor(private readonly configService: ConfigService) {}
  async getOptions(queue: string, noAck = false) {
    return await QueueAdminModule.getClientProvider(
      this.configService,
      queue,
      noAck,
    );
  }

  ack(context: RmqContext) {
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
}
