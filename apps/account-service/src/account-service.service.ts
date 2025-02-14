import { AccountServiceMongooseService } from '@account/account/account-service-mongoose.service';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BrandEntity } from '@brand/brand/entities/brand.entity';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import TransportEnum from '@common/common/enums/TransportEnum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { BasicMicroserviceService } from '@common/common/models/basic.microservices.service';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import { FileUpdateDto } from '@file/file/dto/file.update.dto';
import { FileDocument } from '@file/file/entities/mongoose/file.schema';
import { IntegrationService } from '@integration/integration';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { AttachmentsEmailConfig } from '@message/message/dto/message.create.dto';
import {
  BadRequestException,
  Inject,
  Injectable, NotImplementedException
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ctx, RmqContext } from '@nestjs/microservices';
import { TransferEntity } from '@transfer/transfer/entities/transfer.entity';
import EventsNamesBrandEnum from 'apps/brand-service/src/enum/events.names.brand.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesFileEnum from 'apps/file-service/src/enum/events.names.file.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import * as fs from 'fs';
import { PreorderData, PreorderResponse } from './interfaces/preorderResponse';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { WithdrawalPreorderDto } from './dtos/WithdrawalPreorderDto';
import { WithdrawalError } from './utils/errors';
import { WITHDRAWAL_CONFIG } from './withdrawal.config';
import { WithdrawalExecuteDto } from './dtos/WithdrawalExecuteDto';
import { WithdrawalResponse } from './interfaces/withdrawalResponse';
import { QrDepositDto } from './dtos/qr-deposit.dto';
import { QrDepositResponse } from './interfaces/qr-deposit-response.interface';
import { WithdrawalErrorCode } from './enum/withdrawalErrorCode';
import { FireblocksIntegrationService } from '@integration/integration/crypto/fireblocks/fireblocks-integration.service';
import { DataCreateDepositDto } from './dtos/deposit.dto';
import { NetworkEnum } from './enum/network.enum';


@Traceable()
@Injectable()
export class AccountServiceService
  implements BasicMicroserviceService<AccountDocument> {
  private readonly preorders = new Map<string, PreorderData>();
  private cryptoType: FireblocksIntegrationService | null = null;

  async cleanWallet(query: QuerySearchAnyDto) {
    throw new NotImplementedException();
    // query = query || new QuerySearchAnyDto();
    // query.where = query.where || {};
    // query.where.type = TypesAccountEnum.WALLET;
    // query.where.statusText = StatusAccountEnum.LOCK;
    // query.where.amount = {
    //   $lte: 0,
    // };
    // await this.cleanWalletsWithTransfers(query, 'LOCK');
    // query.where.statusText = StatusAccountEnum.UNLOCK;
    // await this.cleanWalletsWithTransfers(query, 'UNLOCK');
    // return {
    //   statusCode: 200,
    //   message: 'ok',
    // };
  }
  async cleanWalletsWithTransfers(query: QuerySearchAnyDto, msg?: string) {
    const walletsCleanTotal = await this.lib.count(query);
    query.page = 0;
    query.take = query.take || 10;
    const lastPage = Math.ceil(walletsCleanTotal / query.take);
    const promises = [];
    while (query.page < lastPage) {
      ++query.page;
      this.logger.info(`[cleanWalletsWithTransfers] Start page ${query.page}`);
      promises.push(
        this.cleanWalletsWithTx(
          {
            ...query,
          },
          msg,
        ),
      );
      this.logger.info(`[cleanWalletsWithTransfers] End page ${query.page}`);
    }
    return Promise.all(promises);
  }
  async cleanWalletsWithTx(query: QuerySearchAnyDto, msg?: string) {
    this.logger.info(`[cleanWalletsWithTx] Start page ${query.page}`);
    const promises = [];
    const walletsClean = await this.lib.findAll(query);
    const queryTx = {
      where: {
        account: {
          $in: walletsClean.list.map((w) => w._id.toString()),
        },
      },
    };
    const transfersAccounts: ResponsePaginator<TransferEntity> =
      await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.findAll,
        queryTx,
      );
    if (transfersAccounts.totalElements) {
      const accountWithTx = transfersAccounts.list.map((t) => t.account);
      this.logger.info(
        `[cleanWalletsWithTx] Filter wallets with transfers page ${query.page}`,
      );
      promises.push(
        this.lib.updateMany(
          accountWithTx.map((a) => a.toString()),
          accountWithTx.map((a) => {
            return {
              id: a.toString(),
              showToOwner: false,
              statusText: StatusAccountEnum.LOCK,
            };
          }),
        ),
      );
      walletsClean.list = walletsClean.list.filter(
        (w) => !accountWithTx.includes(w._id.toString()),
      );
    } else {
      this.logger.info('[cleanWalletsWithTx] Not found transfers');
    }
    if (walletsClean.list.length) {
      promises.push(
        this.lib.removeMany(walletsClean.list.map((w) => w._id.toString())),
      );
    }
    this.logger.warn(
      `[cleanWalletsWithTx] Removed ${walletsClean.list.length} wallets`,
    );
    this.logger.info(
      `[cleanWalletsWithTx] Total ${msg} wallets to clean ${walletsClean.currentPage}/${walletsClean.lastPage}`,
    );
    return Promise.all(promises);
  }
  constructor(
    @InjectPinoLogger(AccountServiceService.name)
    protected readonly logger: PinoLogger,
    private configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
    @Inject(AccountServiceMongooseService)
    private lib: AccountServiceMongooseService,
    private readonly integration: IntegrationService,
  ) { }
  async download(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<AccountDocument[]> {
    throw new NotImplementedException('Method not implemented.');
  }
  async availableWalletsFireblocks(
    query?: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<AccountDocument>> {
    // Job to check fireblocks available wallets
    query = query || new QuerySearchAnyDto();
    query.where = query.where || {};
    query.take = 10000;
    query.where.accountType = WalletTypesAccountEnum.VAULT;
    query.where.owner = {
      $exists: false,
    };
    const cryptoList = await this.lib.findAll(query);
    // const fireblocksCrm = await this.builder.getPromiseCrmEventClient(
    //   EventsNamesCrmEnum.findOneByName,
    //   IntegrationCryptoEnum.FIREBLOCKS,
    // );
    if (!cryptoList.totalElements) {
      const fireblocksCrm = await this.builder.getPromiseCrmEventClient(
        EventsNamesCrmEnum.findOneByName,
        IntegrationCryptoEnum.FIREBLOCKS,
      );
      const cryptoType = await this.integration.getCryptoIntegration(
        null,
        IntegrationCryptoEnum.FIREBLOCKS,
        '',
      );
      const tmp = await cryptoType.getAvailablerWallets();
      const promises = [];
      tmp.forEach((wallet: AccountCreateDto) => {
        const exist = cryptoList.list.find(
          (x) => x.accountId == wallet.accountId,
        );
        if (exist) {
          return exist;
        }
        wallet.type = TypesAccountEnum.WALLET;
        wallet.brand = query?.where?.brand;
        wallet.crm = fireblocksCrm._id;
        wallet.accountType = WalletTypesAccountEnum.VAULT;
        return promises.push(this.lib.create(wallet));
      });
      cryptoList.list = await Promise.all(promises);
    }
    return cryptoList;
  }

  async networksWalletsFireblocks(query?: QuerySearchAnyDto): Promise<any> {
    // Job to check fireblocks available wallets
    query = query || new QuerySearchAnyDto();
    query.where = query.where || {};
    query.take = 10000;
    query.where.accountType = WalletTypesAccountEnum.VAULT;
    query.where.owner = {
      $exists: false,
    };
    const networkList = await this.lib.groupByNetwork(query);
    return networkList;
  }

  async checkAvailablesWalletsFireblocksAllBrands(query?: QuerySearchAnyDto) {
    query = query || new QuerySearchAnyDto();
    query.where = query.where || {};
    query.take = 10000;
    query.where.accountType = WalletTypesAccountEnum.VAULT;
    query.where.owner = {
      $exists: false,
    };
    let brandList: ResponsePaginator<BrandEntity> = null;
    const promises = [];
    do {
      brandList = await this.builder.getPromiseBrandEventClient(
        EventsNamesBrandEnum.findAll,
        {},
      );
      for (const brand of brandList.list) {
        query.where.brand = brand._id;
        promises.push(
          this.checkAvailablesWalletsFireblocksByBrand({
            ...query,
          }),
        );
      }
    } while (brandList?.nextPage != 1);
    return Promise.all(promises);
  }
  async checkAvailablesWalletsFireblocksByBrand(query?: QuerySearchAnyDto) {
    const cryptoList = await this.lib.findAll(query);
    const fireblocksCrm = await this.builder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );
    const cryptoType = await this.integration.getCryptoIntegration(
      null,
      IntegrationCryptoEnum.FIREBLOCKS,
      '',
    );
    const tmp = await cryptoType.getAvailablerWallets();
    if (cryptoList.totalElements != tmp.length) {
      const promises = [];
      tmp.forEach((wallet: AccountCreateDto) => {
        const exist = cryptoList.list.find(
          (x) => x.accountId == wallet.accountId,
        );
        if (exist) {
          return exist;
        }
        wallet.brand = query?.where?.brand;
        wallet.crm = fireblocksCrm._id;
        wallet.accountType = WalletTypesAccountEnum.VAULT;
        return promises.push(this.lib.create(wallet));
      });
      cryptoList.list = await Promise.all(promises);
    }
    return cryptoList;
  }
  async getBalanceByAccountTypeCard(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByAccountTypeCard(query);
  }

  async getBalanceByOwnerByCard(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByOwnerByCard(query);
  }

  async getBalanceByOwnerByWallet(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByOwnerByWallet(query);
  }

  async getBalanceByAccountByCard(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByAccountByCard(query);
  }

  async getBalanceByAccountByWallet(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByAccountByWallet(query);
  }

  async findAll(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<ResponsePaginator<AccountDocument>> {
    return this.lib.findAll(query);
  }

  async count(query: QuerySearchAnyDto, context?: any): Promise<number> {
    return this.lib.count(query);
  }
  async findOneById(id: string, context?: any): Promise<AccountDocument> {
    return this.lib.findOne(id);
  }
  async createOne(
    createDto: AccountCreateDto,
    context?: any,
  ): Promise<AccountDocument> {
    const account = await this.lib.create(createDto);

    if (account && account.email) {
      const data = {
        destinyText: account.email,
        vars: {
          name: account.firstName,
          lastName: account.lastName,
          accountType: account.accountType,
          cardType: account.type,
          accountId: account.accountId,
          status: account.statusText,
        },
      };

      this.logger.info(
        `[createOne] Account Request Confirmation Email Prepared ${JSON.stringify(
          data,
        )}`,
      );
      this.builder.emitMessageEventClient(
        EventsNamesMessageEnum.sendCardRequestConfirmationEmail,
        data,
      );
    } else {
      this.logger.warn(
        `[createOne] Account created without email. Skipping confirmation email ${JSON.stringify(
          account,
        )}`,
      );
    }

    return account;
  }

  async createMany(
    createDto: AccountCreateDto[],
    context?: any,
  ): Promise<AccountDocument[]> {
    return this.lib.createMany(createDto);
  }
  async updateOne(
    updateDto: AccountUpdateDto,
    context?: any,
  ): Promise<AccountDocument> {
    const id = updateDto.id ?? updateDto._id;
    const account = await this.findOneById(id);
    const statusDisable = await this.builder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      'disable',
    );
    if (account.status === statusDisable._id) {
      throw new BadRequestException('The account was disabled');
    }
    return this.lib.update(id, updateDto);
  }
  async customUpdateOne(updateRequest: any): Promise<AccountDocument> {
    const id = updateRequest.id ?? updateRequest._id;
    delete updateRequest.id;
    delete updateRequest._id;
    return this.lib.update(id, updateRequest);
  }
  async updateMany(
    updateDto: AccountUpdateDto[],
    context?: any,
  ): Promise<AccountDocument[]> {
    return this.lib.updateMany(
      updateDto.map((data) => data.id),
      updateDto,
    );
  }
  async deleteManyById(
    updateDto: UpdateAnyDto[],
    context?: any,
  ): Promise<AccountDocument[]> {
    return this.lib.removeMany(updateDto.map((data) => data.id));
  }
  async deleteOneById(id: string, context?: any): Promise<AccountDocument> {
    return this.lib.remove(id);
  }
  getRta(rta: any, @Ctx() ctx: any) {
    throw new NotImplementedException('Method not implemented.');
  }
  findAllEvent(query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  downloadEvent(query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  findOneByIdEvent(id: string, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  createOneEvent(createAccountDto: CreateAnyDto, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  createManyEvent(
    createAccountsDto: AccountCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    throw this.createMany(createAccountsDto);
  }
  updateOneEvent(updateAccountDto: UpdateAnyDto, @Ctx() ctx: RmqContext) {
    return this.updateOne(updateAccountDto);
  }
  updateManyEvent(updateAccountsDto: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  deleteManyByIdEvent(ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  deleteOneByIdEvent(id: string, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  getBalanceReport(query: QuerySearchAnyDto) {
    // TODO[hender - 2024/09/26] Receive 3 events but trigger only 1 from job
    this.logger.info('[getBalanceReport] Start balance report');
    Promise.all([
      this.getBalanceByAccountTypeCard(query),
      //this.getBalanceByAccountTypeWallet(query),
      this.getBalanceByOwnerByCard(query),
      //this.getBalanceByOwnerByWallet(query),
      this.getBalanceByAccountByCard(query),
      //this.getBalanceByAccountByWallet(query),
    ]).then(async (results) => {
      this.logger.info('[getBalanceReport] Report filter finish');
      const [
        cardTotalAccumulated,
        //walletTotalAccumulated,
        cardByOwner,
        //walletByOwner,
        cards,
        //wallets
      ] = results;
      const date = new Date();
      const promises = [
        this.getContentFileBalanceReport(
          cardTotalAccumulated,
          'total-accumulated',
          ['type', 'quantity', 'sum_available', 'sum_blocked'],
          date,
        ),
        this.getContentFileBalanceReport(
          cardByOwner,
          'cards-by-user',
          ['userId', 'email', 'count', 'amount'],
          date,
        ),
        this.getContentFileBalanceReport(
          cards,
          'all-cards',
          ['email', 'userId', 'cardId', 'description', 'amount'],
          date,
        ),
      ];
      const name = `${process.env.ENVIRONMENT !== EnvironmentEnum.prod
        ? process.env.ENVIRONMENT
        : ''
        } Balance Report ${query.where?.type ?? 'all types'
        } - ${this.printShortDate(date)} UTC`;
      this.sendEmailToList(promises, name);
      this.logger.info('[getBalanceReport] Balance Report sended');
    });
  }

  private printShortDate(date?: Date): string {
    date = date ?? new Date();
    return date.toLocaleString('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
      hourCycle: 'h24',
    });
  }

  private async sendEmailToList(promisesAttachments, subject) {
    const destiny = [
      {
        name: 'Luisa',
        lastName: 'Fernanda',
        email: 'luisa.fernanda@b2crypto.com',
      },
      {
        name: 'Mateo',
        lastName: 'Quintana',
        email: 'mateo.quintana@b2fintech.com',
      },
      {
        name: 'Hamilton',
        lastName: 'Smith',
        email: 'devops@b2fintech.com',
      },
      {
        name: 'Hender',
        lastName: 'Orlando',
        email: 'hender.orlando@b2crypto.com',
      },
    ];
    const attachments = await Promise.all(promisesAttachments);
    this.logger.info('[sendEmailToList] Report finish');
    destiny.forEach((destiny) => {
      this.sendEmail({
        destinyText: destiny.email,
        subject,
        name: destiny.name,
        lastname: destiny.lastName,
        attachments,
      });
    });
  }

  private sendEmail({ destinyText, subject, name, lastname, attachments }) {
    const data = {
      name: subject,
      body: ``,
      originText: `System`,
      destinyText,
      transport: TransportEnum.EMAIL,
      destiny: null,
      vars: {
        name,
        lastname,
      },
      attachments: attachments,
    };

    this.builder.emitMessageEventClient(
      EventsNamesMessageEnum.sendEmailBalanceReport,
      data,
    );
  }

  private async getContentFileBalanceReport(
    list: any[],
    listName: string,
    headers: Array<string>,
    date?: Date,
  ): Promise<AttachmentsEmailConfig> {
    const filename = this.getFullname(listName, date);
    const fileUri = `storage/${filename}`;
    if (fs.existsSync(fileUri)) {
      fs.unlinkSync(fileUri);
    }
    const objBase = this.getCustomObj(headers);
    // File created
    this.addDataToFile(objBase, filename, true, true);
    this.logger.info('[getContentFileBalanceReport] File created');
    return new Promise((res) => {
      // Wait file creation
      setTimeout(async () => {
        list.forEach((item) => {
          const customItem = this.getCustomObj(headers, item);
          // Added rows
          this.addDataToFile(customItem, filename, false);
        });
        // Wait file sending
        this.responseFileContent({
          filename,
          fileUri,
          listName,
          res,
        });
      }, 1000);
    });
  }

  private responseFileContent({ filename, fileUri, listName, res }) {
    setTimeout(async () => {
      if (fs.existsSync(fileUri)) {
        const content = fs.readFileSync(fileUri, {
          encoding: 'base64',
        });
        const fileList = await this.builder.getPromiseFileEventClient<
          ResponsePaginator<FileDocument>
        >(EventsNamesFileEnum.findAll, {
          where: {
            name: filename,
          },
        });
        if (fileList.totalElements > 0) {
          this.builder.emitFileEventClient(EventsNamesFileEnum.updateOne, {
            id: fileList.list[0]._id,
            encodeBase64: content,
          });
        }
        this.logger.info(
          `[responseFileContent] File "${filename}" sent ${listName}`,
        );
        res({
          // encoded string as an attachment
          filename: filename,
          content: content,
          encoding: 'base64',
        });
        if (fs.existsSync(fileUri)) {
          fs.unlinkSync(fileUri);
        }
      } else {
        this.logger.info(
          `[responseFileContent] File "${filename}" not found ${listName}`,
        );
        this.responseFileContent({ filename, fileUri, listName, res });
      }
    }, 20000);
  }

  private getCustomObj(keys: Array<string>, item?: any) {
    const objBase = {};
    keys.forEach((key) => {
      objBase[key] = item ? item[key] ?? '' : null;
    });
    return objBase;
  }

  protected getFullname(baseName: string, today?: Date) {
    today = today ?? new Date();
    const dateStr = `${today.getUTCFullYear()}-${CommonService.getNumberDigits(
      today.getUTCMonth() + 1,
    )}-${today.getUTCDate()} UTC`;
    return `${dateStr}_${baseName.toLowerCase()}.csv`;
  }

  private addDataToFile(item, filename, isFirst, onlyHeaders = false) {
    this.builder.emitFileEventClient<File>(EventsNamesFileEnum.addDataToFile, {
      isFirst,
      onlyHeaders,
      name: filename,
      description: `Send email ${filename}`,
      mimetype: 'text/csv',
      data: JSON.stringify(item),
    } as FileUpdateDto);
  }
  // async networksWalletsFireblocks(
  //   query?: QuerySearchAnyDto,
  // ): Promise<ResponsePaginator<AccountDocument>> {
  //   query = query || new QuerySearchAnyDto();
  //   query.where = query.where || {};
  //   query.where.accountType = WalletTypesAccountEnum.VAULT;
  //   query.where.owner = {
  //     $exists: false,
  //   };

  //   const cryptoList = await this.lib.findAll(query);
  //   const fireblocksCrm = await this.builder.getPromiseCrmEventClient(
  //     EventsNamesCrmEnum.findOneByName,
  //     IntegrationCryptoEnum.FIREBLOCKS,
  //   );
  //   if (!cryptoList.totalElements) {
  //     const cryptoType = await this.integration.getCryptoIntegration(
  //       null,
  //       IntegrationCryptoEnum.FIREBLOCKS,
  //       '',
  //     );
  //     const tmp = await cryptoType.getAvailablerWallets();
  //     const promises = [];
  //     tmp.forEach((wallet: AccountCreateDto) => {
  //       const exist = cryptoList.list.find(
  //         (x) => x.accountId == wallet.accountId,
  //       );
  //       if (exist) {
  //         return exist;
  //       }
  //       wallet.type = TypesAccountEnum.WALLET;
  //       wallet.brand = query?.where?.brand;
  //       wallet.crm = fireblocksCrm._id;
  //       wallet.accountType = WalletTypesAccountEnum.VAULT;
  //       return promises.push(this.lib.create(wallet));
  //     });
  //     cryptoList.list = await Promise.all(promises);
  //   }
  //   return cryptoList;
  // }
  private calculateFees(amount: number, network: NetworkEnum): { networkFee: number; baseFee: number; totalAmount: number; } {
    const networkFee = amount * WITHDRAWAL_CONFIG.fees.networks[network];
    const baseFee = WITHDRAWAL_CONFIG.fees.base;
    const totalAmount = amount + networkFee + baseFee;
    return { networkFee, baseFee, totalAmount };
  }

  private validateSufficientFunds(available: number, required: number, networkFee: number, baseFee: number): void {
    if (available < required) {
      this.logger.error(
        `[withdrawal] Insufficient funds: available=${available}, required=${required}, networkFee=${networkFee}, baseFee=${baseFee}`
      );
      throw new WithdrawalError(
        WithdrawalErrorCode.INSUFFICIENT_FUNDS,
        'Insufficient balance',
        { available, required, fees: { networkFee, baseFee } }
      );
    }
  }

  private createPreorder(dto: WithdrawalPreorderDto, totalAmount: number, networkFee: number, baseFee: number): PreorderResponse {
    const preorderId = `WD_${Date.now()}`;
    const preorder: PreorderData = {
      ...dto,
      totalAmount,
      networkFee,
      baseFee,
      fees: { networkFee, baseFee },
      createdAt: new Date()
    };
    this.preorders.set(preorderId, preorder);
    return {
      preorderId,
      totalAmount,
      originWalletId: dto.walletId,
      destinationAddress: dto.destinationAddress,
      network: dto.network,
      fees: { networkFee, baseFee },
      netAmount: dto.amount,
      expiresAt: new Date(Date.now() + WITHDRAWAL_CONFIG.timing.maxConfirmationTime * 1000)
    };
  }

  async validateAndGenerateDepositQr(dto: QrDepositDto, userId: string): Promise<QrDepositResponse> {
    try {
      const wallet = await this.findOneById(dto.vaultAccountId);

      if (!wallet || wallet.owner.toString() !== userId) {
        this.logger.error(
          `[deposit] Invalid wallet permissions: walletId=${dto.vaultAccountId}, userId=${userId}`
        );
        throw new WithdrawalError(
          WithdrawalErrorCode.INVALID_WALLET,
          'Invalid wallet or insufficient permissions',
          { walletId: dto.vaultAccountId, userId }
        );
      }

      return this.generateDepositQr(dto);
    } catch (error) {
      this.logger.error(
        `[deposit] QR generation validation failed: userId=${userId}, error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  async validateAndExecuteWithdrawal(dto: WithdrawalExecuteDto, userId: string): Promise<WithdrawalResponse> {
    try {
      if (!dto.preorderId) {
        this.logger.error(
          `[withdrawal] Invalid preorder: preorderId=${dto.preorderId}, userId=${userId}`
        );
        throw new WithdrawalError(
          WithdrawalErrorCode.INVALID_PREORDER,
          'Invalid preorder ID',
          { preorderId: dto.preorderId }
        );
      }

      const result = await this.executeWithdrawalOrder(dto);

      this.logger.info(
        `[withdrawal] Execution successful: userId=${userId}, preorderId=${dto.preorderId}, transactionId=${result.transactionId}`
      );

      return result;
    } catch (error) {
      this.logger.error(
        `[withdrawal] Execution failed: userId=${userId}, preorderId=${dto.preorderId}, error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }
  private handleWithdrawalError(error: unknown): void {
    if (error instanceof WithdrawalError) {
      this.logger.error(error.getLogMessage());
    } else {
      this.logger.error(
        `[withdrawal] Unexpected error: error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw new WithdrawalError(
        WithdrawalErrorCode.EXECUTION_FAILED,
        'An unexpected error occurred while validating the withdrawal preorder'
      );
    }
  }

  private async validateFireblocksAddress(address: string, network: NetworkEnum): Promise<void> {
    try {
      const cryptoType = await this.getFireblocksType();
      const assetId = this.getAssetIdFromNetwork(network);
      await cryptoType.validateAddress(assetId, address);
    } catch (error) {
      const fireblocksError = error as { response?: { data?: { message?: string; code?: string } }; message?: string };
      this.logger.error(
        `[withdrawal] Fireblocks validation failed: address=${address}, network=${network}, error=${fireblocksError.response?.data?.message || fireblocksError.message || 'Unknown error'}`
      );
      throw new WithdrawalError(
        WithdrawalErrorCode.FIREBLOCKS_ERROR,
        'Failed to validate with Fireblocks',
        { address, network }
      );
    }
  }

  async executeWithdrawalOrder(dto: WithdrawalExecuteDto): Promise<WithdrawalResponse> {
    const preorder = this.preorders.get(dto.preorderId);
    if (!preorder) {
      this.logger.error(
        `[withdrawal] Preorder not found: preorderId=${dto.preorderId}`
      );
      throw new WithdrawalError(
        WithdrawalErrorCode.INVALID_PREORDER,
        'Preorder not found',
        { preorderId: dto.preorderId }
      );
    }

    try {
      const sourceWallet = await this.validateSourceWallet(preorder.walletId);
      const cryptoType = await this.getFireblocksType();
      const depositResponse = await cryptoType.createDeposit({ data: new DataCreateDepositDto() });

      if (!depositResponse?.data?.[0]) {
        this.logger.error(
          `[withdrawal] Failed to create transaction: preorderId=${dto.preorderId}`
        );
        throw new WithdrawalError(
          WithdrawalErrorCode.EXECUTION_FAILED,
          'Failed to create withdrawal transaction'
        );
      }

      const [transaction] = depositResponse.data;
      await this.updateWalletBalance(preorder.walletId, sourceWallet.amountCustodial, preorder.totalAmount);
      this.preorders.delete(dto.preorderId);

      return {
        transactionId: transaction.transactionId || transaction.id || String(Date.now()),
        status: 'PENDING',
        amount: preorder.amount,
        fees: {
          networkFee: preorder.fees.networkFee,
          baseFee: preorder.fees.baseFee,
          totalFee: preorder.fees.networkFee + preorder.fees.baseFee
        },
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(
        `[withdrawal] Order execution failed: preorderId=${dto.preorderId}, error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private validateAndMapNetwork(network: string): NetworkEnum {
    const networkUpper = network.toUpperCase();

    const isValidNetworkKey = Object.keys(NetworkEnum).includes(networkUpper);

    if (!isValidNetworkKey) {
      this.logger.error(
        `[withdrawal] Invalid network provided: network=${network}`
      );
      throw new WithdrawalError(
        WithdrawalErrorCode.UNSUPPORTED_NETWORK,
        'Invalid network provided',
        { network, supportedNetworks: Object.keys(NetworkEnum) }
      );
    }

    return NetworkEnum[networkUpper as keyof typeof NetworkEnum];
  }

  async validateAndCreateWithdrawalPreorder(
    dto: WithdrawalPreorderDto,
    userId: string
  ): Promise<PreorderResponse> {
    try {
      const wallet = await this.findOneById(dto.walletId);

      if (!wallet || wallet.owner.toString() !== userId) {
        this.logger.error(
          `[withdrawal] Invalid wallet permissions: walletId=${dto.walletId}, userId=${userId}`
        );
        throw new WithdrawalError(
          WithdrawalErrorCode.INVALID_WALLET,
          'Invalid wallet or insufficient permissions'
        );
      }

      // Validar y mapear la network antes de procesar
      const mappedNetwork = this.validateAndMapNetwork(dto.network);
      const modifiedDto = {
        ...dto,
        network: mappedNetwork
      };

      const result = await this.validateWithdrawalPreorder(modifiedDto);
      this.logger.info(
        `[withdrawal] Preorder created: preorderId=${result.preorderId}, userId=${userId}, network=${mappedNetwork}`
      );
      return result;

    } catch (error) {
      this.logger.error(
        `[withdrawal] Create preorder failed: userId=${userId}, error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  async generateDepositQr(dto: QrDepositDto): Promise<QrDepositResponse> {
    try {
      const wallet = await this.validateSourceWallet(dto.vaultAccountId);
      const cryptoType = await this.getFireblocksType();
      const depositAddress = await cryptoType.createDeposit({ data: new DataCreateDepositDto() });

      if (!depositAddress?.data?.[0]?.address) {
        this.logger.error(
          `[deposit] Failed to generate address: vaultId=${dto.vaultAccountId}`
        );
        throw new WithdrawalError(
          WithdrawalErrorCode.EXECUTION_FAILED,
          'Failed to generate deposit address'
        );
      }

      const [addressData] = depositAddress.data;
      const address = addressData.address;
      const scanUrl = this.generateScanUrl(address, dto.network);
      return {
        address,
        qrCode: address,
        network: dto.network,
        amount: Number(dto.amount),
        scanUrl,
        timestamp: new Date()
      };
    } catch (error) {
      this.logger.error(
        `[deposit] QR generation failed: vaultId=${dto.vaultAccountId}, error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private async getFireblocksType(): Promise<FireblocksIntegrationService> {
    if (!this.cryptoType) {
      this.cryptoType = await this.integration.getCryptoIntegration(
        null,
        IntegrationCryptoEnum.FIREBLOCKS,
        ''
      ) as FireblocksIntegrationService;
    }
    return this.cryptoType;
  }

  private getAssetIdFromNetwork(network: NetworkEnum): string {
    const networkToAssetId: Record<NetworkEnum, string> = {
      [NetworkEnum.TRON]: 'USDT_TRX',
      [NetworkEnum.ARBITRUM]: 'USDT_ARB'
    };

    const assetId = networkToAssetId[network];
    if (!assetId) {
      throw new WithdrawalError(
        WithdrawalErrorCode.UNSUPPORTED_NETWORK,
        `Network ${network} is not supported`,
        {
          network,
          supportedNetworks: Object.keys(networkToAssetId),
          providedNetworkEnum: network
        }
      );
    }

    return assetId;
  }

  private async validateSourceWallet(walletId: string): Promise<AccountDocument> {
    const sourceWallet = await this.lib.findOne(walletId);
    if (!sourceWallet) {
      this.logger.error(`[withdrawal] Invalid wallet: walletId=${walletId}`);
      throw new WithdrawalError(
        WithdrawalErrorCode.INVALID_WALLET,
        'Wallet not found',
        { walletId }
      );
    }
    return sourceWallet;
  }

  private async updateWalletBalance(walletId: string, currentBalance: number, amountToSubtract: number): Promise<void> {
    await this.lib.update(walletId, {
      id: walletId,
      amountCustodial: currentBalance - amountToSubtract
    });
  }

  private async validateWithdrawalPreorder(dto: WithdrawalPreorderDto): Promise<PreorderResponse> {
    try {
      const sourceWallet = await this.validateSourceWallet(dto.walletId);
      const { networkFee, baseFee, totalAmount } = this.calculateFees(dto.amount, dto.network);
      this.validateSufficientFunds(sourceWallet.amountCustodial, totalAmount, networkFee, baseFee);
      await this.validateFireblocksAddress(dto.destinationAddress, dto.network);
      return this.createPreorder(dto, totalAmount, networkFee, baseFee);
    } catch (error) {
      this.logger.error(
        `[withdrawal] Preorder validation failed: walletId=${dto.walletId}, error=${error instanceof Error ? error.message : 'Unknown error'}`
      );
      throw error;
    }
  }

  private generateScanUrl(address: string, network: string): string {
    switch (network) {
      case NetworkEnum.TRON:
        return `https://tronscan.org/#/address/${address}`;
      case NetworkEnum.ARBITRUM:
        return `https://arbiscan.io/address/${address}`;
      default:
        return '';
    }
  }
}
