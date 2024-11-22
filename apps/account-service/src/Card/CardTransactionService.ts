import { CardDepositCreateDto } from '@account/account/dto/card-deposit.create.dto';
import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Brand } from '@brand/brand/entities/mongoose/brand.schema';
import { BuildersService } from '@builder/builders';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { CardsEnum } from '@common/common/enums/messages.enum';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PspAccountDocument } from '@psp-account/psp-account/entities/mongoose/psp-account.schema';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User, UserDocument } from '@user/user/entities/mongoose/user.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import { FiatIntegrationClient } from 'apps/integration-service/src/clients/fiat.integration.client';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { Types } from 'mongoose';
import { AccountServiceService } from '../account-service.service';

interface TransferRecordParams {
  name: string;
  description: string;
  currency: string;
  amount: number;
  currencyCustodial: string;
  amountCustodial: number;
  account: string;
  userCreator: string;
  userAccount: string;
  typeTransaction: string;
  operationType: OperationTransactionType;
  brand?: Brand;
  crm?: Crm;
  page?: string;
  statusPayment?: string;
  approve?: boolean;
  status?: string;
  confirmedAt?: Date;
  approvedAt?: Date;
  psp: string;
  pspAccount: string;
}

interface PomeloTransactionData {
  id: string;
  amount: number;
  authorize?: boolean;
  movement?: string;
}

interface AccountBalanceUpdate {
  id: string;
  $inc: { amount: number };
}

@Injectable()
export class CardTransactionService {
  private readonly BLOCK_BALANCE_PERCENTAGE: number;

  constructor(
    private readonly accountService: AccountServiceService,
    private readonly cardBuilder: BuildersService,
    private readonly configService: ConfigService,
    private readonly currencyConversion: FiatIntegrationClient,
  ) {
    this.BLOCK_BALANCE_PERCENTAGE = this.configService.get<number>(
      'AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE',
    );
  }

  async rechargeCard(rechargeDto: CardDepositCreateDto, user: User) {
    const userFoundById =
      await this.cardBuilder.getPromiseUserEventClient<UserDocument>(
        EventsNamesUserEnum.findOneById,
        user.id,
      );

    if (!userFoundById) {
      throw new NotFoundException('User not found');
    }

    if (rechargeDto.amount < 10) {
      throw new BadRequestException('The recharge must be greater than 10');
    }

    const [toAccount, fromAccount] = await Promise.all([
      this.validateAccount(rechargeDto.to.toString(), TypesAccountEnum.CARD),
      this.validateAccount(
        rechargeDto.from.toString(),
        TypesAccountEnum.WALLET,
      ),
    ]);

    if (fromAccount.amount < rechargeDto.amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    const [depositCardCategory, withdrawalWalletCategory] = await Promise.all([
      this.getCategoryBySlug('deposit-card'),
      this.getCategoryBySlug('withdrawal-wallet'),
    ]);

    const approvedStatus =
      await this.cardBuilder.getPromiseStatusEventClient<StatusDocument>(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      );

    const internalPspAccount =
      await this.cardBuilder.getPromisePspAccountEventClient<PspAccountDocument>(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      );

    await Promise.all([
      this.updateAccountBalance(toAccount._id, rechargeDto.amount),
      this.updateAccountBalance(fromAccount._id, -rechargeDto.amount),
      this.createTransferRecords(
        toAccount,
        fromAccount,
        rechargeDto.amount,
        depositCardCategory,
        withdrawalWalletCategory,
        approvedStatus,
        internalPspAccount,
      ),
    ]);

    return {
      ...fromAccount.toObject(),
      amount: fromAccount.amount - rechargeDto.amount,
    };
  }

  async processPomeloTransaction(
    data: PomeloTransactionData,
  ): Promise<CardsEnum> {
    try {
      let txnAmount = 0;
      Logger.log(`Looking for card: ${data.id}`, 'CardTransactionService');

      const cardList = await this.accountService.findAll({
        where: {
          statusText: StatusAccountEnum.UNLOCK,
          'cardConfig.id': data.id,
        },
      });

      const card = cardList.list[0];
      if (!card) {
        return CardsEnum.CARD_PROCESS_CARD_NOT_FOUND;
      }

      if (data.authorize) {
        const allowedBalance =
          card.amount * (1.0 - this.BLOCK_BALANCE_PERCENTAGE);
        if (allowedBalance <= data.amount) {
          return CardsEnum.CARD_PROCESS_INSUFFICIENT_FUNDS;
        }
        txnAmount = data.amount * -1;
      } else {
        txnAmount =
          data.movement?.toUpperCase() === 'DEBIT'
            ? data.amount * -1
            : data.amount;
      }

      await this.updateAccountBalance(card._id, txnAmount);

      return CardsEnum.CARD_PROCESS_OK;
    } catch (error) {
      Logger.error(error, 'CardTransactionService');
      return CardsEnum.CARD_PROCESS_FAILURE;
    }
  }

  private async validateAccount(
    accountId: string | Types.ObjectId,
    expectedType: TypesAccountEnum,
  ): Promise<AccountDocument> {
    if (!accountId) {
      throw new BadRequestException('Account ID is required');
    }

    const id = typeof accountId === 'string' ? accountId : accountId.toString();
    const account = await this.accountService.findOneById(id);

    if (!account) {
      throw new BadRequestException(`Account ${id} not found`);
    }
    if (account.type !== expectedType) {
      throw new BadRequestException(`Invalid account type for ${id}`);
    }
    return account;
  }

  private async updateAccountBalance(
    accountId: Types.ObjectId | string,
    amount: number,
  ) {
    const update: AccountBalanceUpdate = {
      id: accountId.toString(),
      $inc: { amount },
    };
    return this.accountService.customUpdateOne(update);
  }

  private async getCategoryBySlug(slug: string): Promise<CategoryDocument> {
    const categories = await this.cardBuilder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findAll,
      {
        where: {
          slug,
        },
      },
    );

    if (!categories.totalElements) {
      throw new BadRequestException(`Category ${slug} not found`);
    }

    return categories.list[0];
  }

  private async createTransferRecords(
    toAccount: AccountDocument,
    fromAccount: AccountDocument,
    amount: number,
    depositCategory: CategoryDocument,
    withdrawalCategory: CategoryDocument,
    status: StatusDocument,
    pspAccount: PspAccountDocument,
  ) {
    const baseTransferRecord = {
      amount,
      currency: toAccount.currency,
      amountCustodial: amount,
      currencyCustodial: toAccount.currencyCustodial,
      page: '',
      statusPayment: 'APPROVED',
      approve: true,
      status: 'approved',
      confirmedAt: new Date(),
      approvedAt: new Date(),
    };

    const depositRecord: TransferRecordParams = {
      ...baseTransferRecord,
      name: `Recharge card ${toAccount.name}`,
      description: `Recharge from wallet ${fromAccount.name} to card ${toAccount.name}`,
      account: toAccount._id.toString(),
      userCreator: fromAccount.owner.toString(),
      userAccount: toAccount.owner.toString(),
      typeTransaction: depositCategory._id.toString(),
      operationType: OperationTransactionType.deposit,
      brand: toAccount.brand,
      crm: toAccount.crm,
      psp: String(pspAccount.psp),
      pspAccount: pspAccount._id,
      status: status._id,
    };

    const withdrawalRecord: TransferRecordParams = {
      ...baseTransferRecord,
      name: `Withdrawal wallet ${fromAccount.name}`,
      description: `Recharge from wallet ${fromAccount.name} to card ${toAccount.name}`,
      account: fromAccount._id.toString(),
      userCreator: fromAccount.owner.toString(),
      userAccount: fromAccount.owner.toString(),
      typeTransaction: withdrawalCategory._id.toString(),
      operationType: OperationTransactionType.withdrawal,
      brand: fromAccount.brand,
      crm: fromAccount.crm,
      psp: String(pspAccount.psp),
      pspAccount: pspAccount._id,
      status: status._id,
    };

    await Promise.all([
      this.cardBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        depositRecord,
      ),
      this.cardBuilder.emitTransferEventClient(
        EventsNamesTransferEnum.createOne,
        withdrawalRecord,
      ),
    ]);
  }

  async findAll(query: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    return this.accountService.findAll(query);
  }

  async findAllMe(query: QuerySearchAnyDto, req: any) {
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    query.where.showToOwner = query.where.showToOwner ?? true;

    const rta = await this.accountService.findAll(query);

    const amounts = await Promise.all(
      rta.list.map((account) => this.swapToCurrencyUser(req, account)),
    );

    rta.list = rta.list.map((account, index) => {
      account.amount = amounts[index];
      account.currency = req.user.currency ?? CurrencyCodeB2cryptoEnum.USD;

      return account;
    });

    return rta;
  }

  async createCard(createDto: CardCreateDto, user: User) {
    createDto.accountType =
      createDto.accountType ?? CardTypesAccountEnum.VIRTUAL;
    createDto.owner = user.id;

    return this.accountService.createOne(createDto);
  }

  async updateCardStatus(cardId: string, status: string) {
    if (!cardId) {
      throw new BadRequestException('Card ID is required');
    }
    return this.accountService.customUpdateOne({
      id: cardId,
      statusText: status,
    });
  }

  async updateVisibility(cardId: string, visible: boolean) {
    if (!cardId) {
      throw new BadRequestException('Card ID is required');
    }
    return this.accountService.customUpdateOne({
      id: cardId,
      showToOwner: visible,
    });
  }

  private async swapToCurrencyUser(req: any, account: AccountDocument) {
    req.user.currency = req.user.currency ?? CurrencyCodeB2cryptoEnum.USD;
    if (
      (account.amount === 0 && account.amountCustodial === 0) ||
      req.user.currency === account.currencyCustodial
    ) {
      return account.amount || account.amountCustodial;
    }
    try {
      const amount = await this.currencyConversion.getCurrencyConversion(
        req.user.currency,
        account.currencyCustodial,
        account.amountCustodial || account.amount,
      );
      return amount;
    } catch (err) {
      Logger.error(err, 'CardTransactionService');
      return account.amountCustodial || account.amount;
    }
  }
}
