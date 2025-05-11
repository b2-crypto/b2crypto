import EventClientEnum from '@common/common/enums/EventsNameEnum';
import { QueueAdminModule } from '@common/common/queue-admin-providers/queue.admin.provider.module';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ResponseB2CryptoModule } from '@response-b2crypto/response-b2crypto';
import { BuildersService } from './builders.service';

@Module({
  imports: [ResponseB2CryptoModule],
  providers: [
    BuildersService,
    ConfigService,
    {
      provide: EventClientEnum.SERVICE_NAME,
      useFactory: QueueAdminModule.factoryEventClient(
        EventClientEnum.SERVICE_NAME,
      ),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.ACTIVITY,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.ACTIVITY),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.ACCOUNT,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.ACCOUNT),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.GROUP,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.GROUP),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.AFFILIATE,
      useFactory: QueueAdminModule.factoryEventClient(
        EventClientEnum.AFFILIATE,
      ),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.BRAND,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.BRAND),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.LEAD,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.LEAD),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.CRM,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.CRM),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.FILE,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.FILE),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.MESSAGE,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.MESSAGE),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.CATEGORY,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.CATEGORY),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.TRAFFIC,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.TRAFFIC),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.PERMISSION,
      useFactory: QueueAdminModule.factoryEventClient(
        EventClientEnum.PERMISSION,
      ),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.PERSON,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.PERSON),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.PSP,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.PSP),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.PSP_ACCOUNT,
      useFactory: QueueAdminModule.factoryEventClient(
        EventClientEnum.PSP_ACCOUNT,
      ),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.USER,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.USER),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.ROLE,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.ROLE),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.STATS,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.STATS),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.STATUS,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.STATUS),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.TRANSFER,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.TRANSFER),
      inject: [ConfigService],
    },
    {
      provide: EventClientEnum.OUTBOX,
      useFactory: QueueAdminModule.factoryEventClient(EventClientEnum.OUTBOX),
      inject: [ConfigService],
    },
  ],
  exports: [BuildersService],
})
export class BuildersModule {}
