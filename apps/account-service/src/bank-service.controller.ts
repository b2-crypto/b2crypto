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
import { User } from '@user/user/entities/mongoose/user.schema';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { NoCache } from '@common/common/decorators/no-cache.decorator';

@ApiTags('BANK')
@Controller('bank')
export class BankServiceController {
  constructor(
    private readonly bankService: BankServiceService,
  ) {}

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