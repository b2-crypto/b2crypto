import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  Controller,
  Inject,
  NotImplementedException,
  Param,
  Post,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { PomeloMigrationService } from './services/pomelo.migration.service';

@Traceable()
@Controller('pomelo-migration')
export class PomeloMigrationController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly migrationService: PomeloMigrationService,
  ) {}
  @Post('ignate')
  async ignatePomeloIntegration() {
    return new NotImplementedException('Method not implemented.');
    this.logger.debug('Starting ...', 'PomeloMigrationController');
    //await this.migrationService.startPomeloMigration();
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }

  @Post('ignate-by-user/:userId')
  async ignatePomeloIntegrationByUser(@Param('userId') userId: string) {
    this.logger.debug(
      `Starting migration by user: ${userId}`,
      'PomeloMigrationController',
    );
    await this.migrationService.startPomeloMigrationByUser(userId);
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }

  @Post('set-cards-owner')
  async setCardsOwner() {
    this.logger.debug(
      `Starting to set cards owner`,
      'PomeloMigrationController',
    );
    await this.migrationService.setAllCardsOwner();
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }
}
