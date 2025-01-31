import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  Controller,
  Logger,
  NotImplementedException,
  Param,
  Post,
} from '@nestjs/common';
import { PomeloMigrationService } from './services/pomelo.migration.service';

@Traceable()
@Controller('pomelo-migration')
export class PomeloMigrationController {
  constructor(private readonly migrationService: PomeloMigrationService) {}
  @Post('ignate')
  async ignatePomeloIntegration() {
    return new NotImplementedException('Method not implemented.');
    Logger.log('Starting ...', 'PomeloMigrationController');
    //await this.migrationService.startPomeloMigration();
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }

  @Post('ignate-by-user/:userId')
  async ignatePomeloIntegrationByUser(@Param('userId') userId: string) {
    Logger.log(
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
    Logger.log(`Starting to set cards owner`, 'PomeloMigrationController');
    await this.migrationService.setAllCardsOwner();
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }
}
