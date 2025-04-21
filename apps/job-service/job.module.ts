import { DistributedCacheModule } from '@app/distributed-cache';
import { BuildersModule } from '@builder/builders';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { OutboxModule } from '@outbox/outbox';
import { JobController } from './job.controller';
import { JobService } from './job.service';

@Module({
  controllers: [JobController],
  imports: [
    BuildersModule,
    ScheduleModule.forRoot(),
    DistributedCacheModule,
    OutboxModule,
  ],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
