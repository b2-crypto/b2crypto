import { Controller, Logger, Post } from '@nestjs/common';
import { PomeloMigrationService } from './services/pomelo.migration.service';

@Controller('pomelo-migration')
export class PomeloMigrationController {
  constructor(private readonly migrationService: PomeloMigrationService) {}
  @Post('ignate')
  async ignatePomeloIntegration() {
    Logger.log('Starting ...', 'PomeloMigrationController');
    this.migrationService.startPomeloMigration();
  }
}
