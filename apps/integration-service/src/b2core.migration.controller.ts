import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  Controller,
  NotImplementedException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { B2CoreMigrationService } from './services/b2core.migration.service';

@Traceable()
@Controller('b2core-migration')
export class B2CoreMigrationController {
  constructor(
    @InjectPinoLogger(B2CoreMigrationController.name)
    protected readonly logger: PinoLogger,
    private readonly migrationService: B2CoreMigrationService,
  ) {}

  @Post('ignate')
  @UseInterceptors(FileInterceptor('file'))
  async ignateB2CoreMigration(@UploadedFile() file: Express.Multer.File) {
    return new NotImplementedException('Method not implemented.');
    //return this.migrationService.startB2CoreMigration(file);
  }

  @Post('verification/ignate')
  @UseInterceptors(FileInterceptor('file'))
  async migrationB2CoreVerification(@UploadedFile() file: Express.Multer.File) {
    //return new NotImplementedException('Method not implemented.');

    this.logger.info(`[migrationB2CoreVerification] File: ${file.path}`);
    return this.migrationService.migrateB2CoreVerification(file);
  }
}
