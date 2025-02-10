import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  Controller,
  NotImplementedException,
  Param,
  Post,
} from '@nestjs/common';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { PomeloMigrationService } from './services/pomelo.migration.service';

@Traceable()
@Controller('pomelo-migration')
export class PomeloMigrationController {
  constructor(
    @InjectPinoLogger(PomeloMigrationController.name)
    protected readonly logger: PinoLogger,
    private readonly migrationService: PomeloMigrationService,
  ) {}
  @Post('ignate')
  async ignatePomeloIntegration() {
    return new NotImplementedException('Method not implemented.');
    this.logger.info(`[ignatePomeloIntegration] Starting ...`);
    //await this.migrationService.startPomeloMigration();
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }

  @Post('ignate-by-user/:userId')
  async ignatePomeloIntegrationByUser(@Param('userId') userId: string) {
    this.logger.info(
      `[ignatePomeloIntegrationByUser] Starting migration by user: ${userId}`,
    );
    await this.migrationService.startPomeloMigrationByUser(userId);
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }

  @Post('set-cards-owner')
  async setCardsOwner() {
    this.logger.info(`[setCardsOwner] Starting to set cards owner`);
    await this.migrationService.setAllCardsOwner();
    return {
      statusCode: 200,
      data: 'Finnished',
    };
  }
}
