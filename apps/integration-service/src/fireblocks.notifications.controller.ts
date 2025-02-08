import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import { TransactionStateEnum } from '@fireblocks/ts-sdk';
import { IntegrationService } from '@integration/integration';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { FireblocksIntegrationService } from '@integration/integration/crypto/fireblocks/fireblocks-integration.service';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Req,
} from '@nestjs/common';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { isMongoId } from 'class-validator';
import * as crypto from 'crypto';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';

@Traceable()
@Controller('fireblocks')
//@UseGuards(ApiKeyAuthGuard)
export class FireBlocksNotificationsController {
  private cryptoType = null;
  private crm = null;
  private publicKey = `-----BEGIN PUBLIC KEY-----
  MIICIjANBgkqhkiG9w0BAQEFAAOCAg8AMIICCgKCAgEA0+6wd9OJQpK60ZI7qnZG
  jjQ0wNFUHfRv85Tdyek8+ahlg1Ph8uhwl4N6DZw5LwLXhNjzAbQ8LGPxt36RUZl5
  YlxTru0jZNKx5lslR+H4i936A4pKBjgiMmSkVwXD9HcfKHTp70GQ812+J0Fvti/v
  4nrrUpc011Wo4F6omt1QcYsi4GTI5OsEbeKQ24BtUd6Z1Nm/EP7PfPxeb4CP8KOH
  clM8K7OwBUfWrip8Ptljjz9BNOZUF94iyjJ/BIzGJjyCntho64ehpUYP8UJykLVd
  CGcu7sVYWnknf1ZGLuqqZQt4qt7cUUhFGielssZP9N9x7wzaAIFcT3yQ+ELDu1SZ
  dE4lZsf2uMyfj58V8GDOLLE233+LRsRbJ083x+e2mW5BdAGtGgQBusFfnmv5Bxqd
  HgS55hsna5725/44tvxll261TgQvjGrTxwe7e5Ia3d2Syc+e89mXQaI/+cZnylNP
  SwCCvx8mOM847T0XkVRX3ZrwXtHIA25uKsPJzUtksDnAowB91j7RJkjXxJcz3Vh1
  4k182UFOTPRW9jzdWNSyWQGl/vpe9oQ4c2Ly15+/toBo4YXJeDdDnZ5c/O+KKadc
  IMPBpnPrH/0O97uMPuED+nI6ISGOTMLZo35xJ96gPBwyG5s2QxIkKPXIrhgcgUnk
  tSM7QYNhlftT4/yVvYnk0YcCAwEAAQ==
  -----END PUBLIC KEY-----`.replace(/\\n/g, '\n');
  constructor(
    @InjectPinoLogger(FireBlocksNotificationsController.name)
    protected readonly logger: PinoLogger,
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
    private readonly builder: BuildersService,
    @Inject(IntegrationService)
    private integrationService: IntegrationService,
  ) {
    this.getFireblocksType();
  }

  @Get('resend-notifications')
  @AllowAnon()
  @NoCache()
  async resendFireblocksNotifications() {
    const rta = await (await this.getFireblocksType()).resendNotifications();
    this.logger.info(
      `[resendFireblocksNotifications] ${JSON.stringify(rta, null, 2)}`,
    );
    return rta;
  }
  // ----------------------------
  @AllowAnon()
  @Post('webhook')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async webhook(@Req() req: any, @Body() data: any) {
    this.logger.info(`[webhook] data: ${JSON.stringify(data)}`);
    this.logger.info(`[webhook] headers: ${JSON.stringify(req.headers)}`);
    //const isVerified = this.verifySign(req);
    //this.logger.info(isVerified, 'getTransferDto.isVerified');
    //if (isVerified) {
    const rta = data.data;
    this.logger.info(`[webhook] rta: ${JSON.stringify(rta)}`);
    if (
      rta.id &&
      rta.status &&
      (rta?.source?.type === 'UNKNOWN' ||
        (rta?.source?.type === 'VAULT_ACCOUNT' &&
          rta?.destination?.type === 'EXTERNAL_WALLET')) &&
      (rta?.status === 'CONFIRMED' || rta?.status === 'COMPLETED') &&
      !(await this.cacheManager.get<string>(rta.id))
    ) {
      this.cacheManager.set(rta.id, rta.status, 10 * 1000);
      const txList = await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.findAll,
        {
          idPayment: rta.id,
        },
      );
      const tx = txList.list[0];

      this.logger.info(`[webhook] tx: ${JSON.stringify(tx)}`);

      if (!tx) {
        const dto = await this.getTransferDto(data);
        if (dto) {
          this.builder.emitTransferEventClient(
            EventsNamesTransferEnum.createOne,
            dto,
          );
        }
        //} else if (rta?.status === 'COMPLETED' && !tx.isApprove) {
      } else if (!tx.isApprove) {
        const status = await this.builder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          StatusCashierEnum.APPROVED,
        );
        tx.statusPayment = rta.status;
        tx.status = status;
        // Find status list
        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.updateOne,
          {
            id: tx._id,
            status: status._id,
            responsePayment: data,
            statusPayment: tx.statusPayment,
            isApprove: true,
            rejectedAt: null,
            approvedAt: new Date(),
          },
        );
      }
      this.logger.info(
        `[webhook] rta.status: ${rta?.status} | rta?.id - rta.status : ${rta?.id} - ${rta.status}`,
      );
    }
    //}
    //return isVerified ? 'ok' : 'fail';
    //this.logger.info(this.verifySign(req), 'getTransferDto.isVerified');
    return {
      statusCode: 200,
      message: 'ok',
    };
  }

  private verifySign(req) {
    const message = JSON.stringify(req.body);
    const signature = req.headers['fireblocks-signature'];

    const verifier = crypto.createVerify('RSA-SHA512');
    verifier.write(message);
    verifier.end();

    const isVerified = verifier.verify(this.publicKey, signature, 'base64');
    this.logger.info(`[verifySign] Verified: ${isVerified}`);
    return isVerified;
  }

  private async getFireblocksType(): Promise<FireblocksIntegrationService> {
    if (!this.cryptoType) {
      this.cryptoType = this.integrationService.getCryptoIntegration(
        null,
        IntegrationCryptoEnum.FIREBLOCKS,
        '',
      );
    }
    return this.cryptoType;
  }

  private async getFireblocksCrm(): Promise<AccountDocument> {
    if (!this.crm) {
      this.crm = this.builder.getPromiseCrmEventClient(
        EventsNamesCrmEnum.findOneByName,
        IntegrationCryptoEnum.FIREBLOCKS,
      );
    }
    return this.crm;
  }

  private async getTransferDto(fullData) {
    const data = fullData.data;
    const isDeposit = data.destination.type === 'VAULT_ACCOUNT';
    const isWithdrawal = data.destination.type === 'EXTERNAL_WALLET';
    const ownerIdWallet = isDeposit ? data.destination.name : data.source.name;
    // const brand = await this.builder.getPromiseBrandEventClient(
    //   EventsNamesBrandEnum.findOneByName,
    //   ownerIdWallet.replace('-vault', ''),
    // );
    // if (!brand || !brand.owner) {
    //   throw new BadRequestException('Brand without owner');
    // }
    // const ownerId = brand.owner;
    const ownerId = ownerIdWallet.replace('-vault', '');
    if (!isMongoId(ownerId)) {
      this.logger.info(`[getTransferDto] Invalid ownerId ${ownerIdWallet}`);
      return null;
    }
    const crm = await this.getFireblocksCrm();
    const queryWhereWallet = {
      owner: ownerId,
      accountType: WalletTypesAccountEnum.VAULT,
      crm: crm._id,
      showToOwner: true,
      accountId: data.assetId,
    };
    const walletList = await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.findAll,
      {
        where: queryWhereWallet,
      },
    );
    const wallet = walletList.list[0];
    if (!wallet) {
      this.logger.error(
        `[getTransferDto] Wallet not found with where ${JSON.stringify(
          queryWhereWallet,
        )}`,
      );
      return null;
    }
    let isApproved = null;
    if (data.status === 'CONFIRMED' || data.status === 'COMPLETED') {
      isApproved = true;
    } else if (
      data.status === TransactionStateEnum.Rejected ||
      data.status === TransactionStateEnum.Failed ||
      data.status === TransactionStateEnum.Cancelled ||
      data.status === TransactionStateEnum.Blocked
    ) {
      isApproved = false;
    }
    let statusText = StatusCashierEnum.PENDING;
    if (isApproved === true) {
      statusText = StatusCashierEnum.APPROVED;
    } else if (isApproved === false) {
      statusText = StatusCashierEnum.REJECTED;
    }
    const status = await this.builder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      statusText,
    );
    let operationText = 'transfer';
    let operationType = OperationTransactionType.noApply;
    if (isDeposit) {
      operationText = 'deposit wallet';
      operationType = OperationTransactionType.deposit;
    } else if (isWithdrawal) {
      operationText = 'withdrawal wallet';
      operationType = OperationTransactionType.withdrawal;
    }
    const operation = await this.builder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      { slug: CommonService.getSlug(operationText) },
    );
    if (!operation?._id) {
      throw new BadRequestException('Not found operation');
    }
    return {
      responseAccount: fullData,
      idPayment: data.id,
      statusPayment: data.status,
      //leadAccountId: data.assetId,
      amount: data.amount,
      status,
      //! Check crypto currencies
      //currency: data.assetType,
      currency: CurrencyCodeB2cryptoEnum.USDT,
      amountCustodial: data.amountUSDT,
      currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
      operationType,
      typeTransaction: operation._id,
      typeAccount: wallet.accountType,
      account: wallet,
      crm,
      userAccount: wallet.owner,
      isApprove: isApproved,
      approvedAt: isApproved === null || !isApproved ? null : new Date(),
      rejectedAt: isApproved === null || isApproved ? null : new Date(),
      userApprover: isApproved ? null : wallet.owner,
      userRejecter: isApproved ? null : wallet.owner,
      description: data.note,
    } as unknown as TransferCreateDto;
  }
}
