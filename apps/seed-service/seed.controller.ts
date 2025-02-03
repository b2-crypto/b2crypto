import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BadRequestException, Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SeedService } from './seed.service';

@ApiTags('Seed')
@Traceable()
@Controller('seed')
export class SeedController {
  constructor(private readonly seedService: SeedService) {}

  @Get()
  // @Auth(ValidRoles.admin)
  executeSeed() {
    //return this.seedService.runSeed();
    //return this.seedService.saveInitialData();
    throw new BadRequestException('Not implmented');
  }
}
