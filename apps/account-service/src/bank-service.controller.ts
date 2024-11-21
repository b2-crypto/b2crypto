import { BankDepositCreateDto } from '@account/account/dto/bank-deposit.create.dto';
import { BankCreateDto } from '@account/account/dto/bank.create.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import { BankServiceService } from './bank-service.service';

@ApiTags('BANK')
@Controller('bank')
export class BankServiceController {
  constructor(private readonly bankService: BankServiceService) {}

  @Get('all')
  @NoCache()
  findAll(@Query() query: QuerySearchAnyDto, req?: any) {
    return this.bankService.findAll(query);
  }

  @Get('me')
  @NoCache()
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    return this.bankService.findAllMe(query, req);
  }

  @Post('create')
  createOne(@Body() createDto: BankCreateDto, @Req() req?: any) {
    return this.bankService.createOne(createDto, req);
  }

  @Post('deposit')
  depositOne(@Body() createDto: BankDepositCreateDto, @Req() req?: any) {
    return this.bankService.depositOne(createDto, req);
  }

  @Delete(':bankAccountID')
  deleteOneById(@Param('bankAccountID') id: string, req?: any) {
    return this.bankService.deleteOneById(id);
  }
}
