import {
  Controller,
  Logger,
  NotImplementedException,
  Post,
} from '@nestjs/common';
import { PomeloMigrationService } from './services/pomelo.migration.service';

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
}
