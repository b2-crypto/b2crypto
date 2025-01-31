import { Traceable } from '@amplication/opentelemetry-nestjs';
import {
  Controller,
  Inject,
  NotImplementedException,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import { B2CoreMigrationService } from './services/b2core.migration.service';

@Traceable()
@Controller('b2core-migration')
export class B2CoreMigrationController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
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

    this.logger.debug(`File: ${file.path}`);
    return this.migrationService.migrateB2CoreVerification(file);
  }
}
