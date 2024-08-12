import {
  Controller,
  Logger,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

@Controller('b2core-migration')
export class B2CoreMigrationController {
  @Post('ignate')
  @UseInterceptors(FileInterceptor('file'))
  async ignateB2CoreMigration(@UploadedFile() file) {
    const results = [];
    createReadStream(file.path)
      .pipe(csvParser())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        Logger.log(results, B2CoreMigrationController.name);
      });
  }
}
