import { BankDepositCreateDto } from '@account/account/dto/bank-deposit.create.dto';
import { BankCreateDto } from '@account/account/dto/bank.create.dto';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { IntegrationService } from '@integration/integration';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
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

@ApiTags('BANK')
@Controller('bank')
export class BankServiceController extends AccountServiceController {
  constructor(
    readonly bankAccountService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(CategoryServiceService)
    private readonly categoryService: CategoryServiceService,
    @Inject(StatusServiceService)
    private readonly statusService: StatusServiceService,
    @Inject(GroupServiceService)
    private readonly groupService: GroupServiceService,
    @Inject(BuildersService)
    readonly bankAccountBuilder: BuildersService,
    private readonly integration: IntegrationService,
  ) {
    super(bankAccountService, bankAccountBuilder);
  }

  @Get('all')
  findAll(@Query() query: QuerySearchAnyDto, req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.BANK;
    return this.bankAccountService.findAll(query);
  }
  @Get('me')
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.BANK;
    query = CommonService.updateQueryWithUserId(query, req, 'owner');
    return this.bankAccountService.findAll(query);
  }

  @Post('create')
  async createOne(@Body() createDto: BankCreateDto, @Req() req?: any) {
    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: {
          _id: CommonService.getUserId(req),
        },
      })
    ).list[0];
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    createDto.owner = user.id;
    createDto.pin =
      createDto.pin ??
      parseInt(
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
      );
    const account = await this.bankAccountService.createOne(createDto);
    // Integration Bank
    return account;
  }

  @Post('deposit')
  async depositOne(@Body() createDto: BankDepositCreateDto, @Req() req?: any) {
    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: {
          _id: req?.user.id,
        },
      })
    ).list[0];
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    if (createDto.amount <= 0) {
      throw new BadRequestException('The recharge not be 0 or less');
    }
    if (!createDto.from) {
      throw new BadRequestException('I need a wallet to recharge bank account');
    }
    const to = await this.getAccountService().findOneById(
      createDto.id.toString(),
    );
    if (to.type != TypesAccountEnum.BANK) {
      throw new BadRequestException('Bank account not found');
    }
    const from = await this.getAccountService().findOneById(
      createDto.from.toString(),
    );
    if (from.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }
    if (!from) {
      throw new BadRequestException('Wallet is not valid1');
    }
    if (from.amount < createDto.amount) {
      throw new BadRequestException('Wallet with enough balance');
    }
    return Promise.all([
      this.bankAccountService.customUpdateOne({
        id: createDto.id,
        $inc: {
          amount: createDto.amount,
        },
      }),
      this.bankAccountService.customUpdateOne({
        id: createDto.from.toString(),
        $inc: {
          amount: createDto.amount * -1,
        },
      }),
    ]).then((list) => list[0]);
  }

  @Delete(':bankAccountID')
  deleteOneById(@Param('bankAccountID') id: string, req?: any) {
    return this.getAccountService().deleteOneById(id);
  }
}
