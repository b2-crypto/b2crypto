import { Traceable } from '@amplication/opentelemetry-nestjs';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { JobService } from './job.service';

@ApiTags('JOBS')
@Traceable()
@Controller('job')
export class JobController {
  constructor(private readonly jobService: JobService) {}
}
