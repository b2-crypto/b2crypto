import { BankDepositCreateDto } from '@account/account/dto/bank-deposit.create.dto';
import { BankCreateDto } from '@account/account/dto/bank.create.dto';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { CommonService } from '@common/common';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '@user/user/entities/mongoose/user.schema';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceService } from './account-service.service';

@Traceable()
@Injectable()
export class BankServiceService {
  constructor(
    private readonly accountService: AccountServiceService,
    private readonly userService: UserServiceService,
  ) {}

  async findAll(query: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.BANK;
    return this.accountService.findAll(query);
  }

  async findAllMe(query: QuerySearchAnyDto, req: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.BANK;
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    return this.accountService.findAll(query);
  }

  async createOne(createDto: BankCreateDto, req: any) {
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
      CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
    const account = await this.accountService.createOne(createDto);
    // Integration Bank
    return account;
  }

  async depositOne(createDto: BankDepositCreateDto, req: any) {
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
    const to = await this.accountService.findOneById(createDto.id.toString());
    if (to.type != TypesAccountEnum.BANK) {
      throw new BadRequestException('Bank account not found');
    }
    const from = await this.accountService.findOneById(
      createDto.from.toString(),
    );
    if (from.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }
    if (!from) {
      throw new BadRequestException('Wallet is not valid');
    }
    if (from.amount < createDto.amount) {
      throw new BadRequestException('Wallet with not enough balance');
    }
    return Promise.all([
      this.accountService.customUpdateOne({
        id: createDto.id,
        $inc: {
          amount: createDto.amount,
        },
      }),
      this.accountService.customUpdateOne({
        id: createDto.from.toString(),
        $inc: {
          amount: createDto.amount * -1,
        },
      }),
    ]).then((list) => list[0]);
  }

  deleteOneById(id: string) {
    return this.accountService.deleteOneById(id);
  }
}
