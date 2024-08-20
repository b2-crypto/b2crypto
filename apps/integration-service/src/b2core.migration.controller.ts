import {
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { B2CoreMigrationService } from './services/b2core.migration.service';

@Controller('b2core-migration')
export class B2CoreMigrationController {
  constructor(private readonly migrationService: B2CoreMigrationService) {}

  @Post('ignate')
  @UseInterceptors(FileInterceptor('file'))
  async ignateB2CoreMigration(@UploadedFile() file: Express.Multer.File) {
    return this.migrationService.startB2CoreMigration(file);
  }
}
