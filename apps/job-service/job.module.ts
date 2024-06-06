import { BuildersModule } from '@builder/builders';
import { JobController } from './job.controller';
import { JobService } from './job.service';
import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  controllers: [JobController],
  imports: [BuildersModule, ScheduleModule.forRoot()],
  providers: [JobService],
  exports: [JobService],
})
export class JobModule {}
