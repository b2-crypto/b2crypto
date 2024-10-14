import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { AllowAnon } from '@auth/auth/decorators/allow-anon.decorator';
import { BuildersService } from '@builder/builders';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { IntegrationService } from '@integration/integration';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { FireblocksIntegrationService } from '@integration/integration/crypto/fireblocks/fireblocks-integration.service';
import {
  Body,
  Controller,
  Get,
  Inject,
  Logger,
  Post,
  Req,
} from '@nestjs/common';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import * as crypto from 'crypto';

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
    Logger.debug(JSON.stringify(rta, null, 2), 'resendFireblocksNotifications');
    return rta;
  }
  // ----------------------------
  @AllowAnon()
  @Post('webhook')
  // @CheckPoliciesAbility(new PolicyHandlerTransferRead())
  async webhook(@Req() req: any, @Body() data: any) {
    Logger.debug(JSON.stringify(data, null, 2), 'getTransferDto.body');
    Logger.log(req.headers, 'getTransferDto.headers');
    //const isVerified = this.verifySign(req);
    //Logger.debug(isVerified, 'getTransferDto.isVerified');
    //if (isVerified) {
    const rta = data;
    if (rta.source.type === 'UNKNOWN') {
      const txList = await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.findAll,
        {
          where: {
            crmTransactionId: rta.id,
          },
        },
      );
      const tx = txList.list[0];
      Logger.debug(tx, 'tx');
      if (!tx) {
        const dto = await this.getTransferDto(rta);
        Logger.debug(dto, 'dto');
        if (dto) {
          this.builder.emitTransferEventClient(
            EventsNamesTransferEnum.createOne,
            dto,
          );
        }
      } else if (rta.status === 'SUBMITTED') {
        tx.statusPayment = rta.status;
        // Find status list
        this.builder.emitTransferEventClient(
          EventsNamesTransferEnum.updateOne,
          {
            id: tx.id,
            statusPayment: tx.statusPayment,
          },
        );
      }
      Logger.debug(rta.status, `${rta.id} - ${rta.status}`);
      tx.statusPayment = rta.status;
    }
    //}
    //return isVerified ? 'ok' : 'fail';
    Logger.debug(this.verifySign(req), 'getTransferDto.isVerified');
    return 'ok';
  }

  private verifySign(req) {
    const message = JSON.stringify(req.body);
    const signature = req.headers['fireblocks-signature'];

    const verifier = crypto.createVerify('RSA-SHA512');
    verifier.write(message);
    verifier.end();

    const isVerified = verifier.verify(this.publicKey, signature, 'base64');
    Logger.log(isVerified, 'Verified:');
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

  private async getTransferDto(data) {
    const ownerId = data.destination.name.replace('-vault', '');
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
      Logger.error(queryWhereWallet, 'Wallet not found with where');
      return null;
    }
    const isApproved = data.status === 'SUBMITTED';
    //! Check withdrawal
    const isDeposit = true;
    const isWithdrawal = false;
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
      operationText,
    );
    return {
      responseAccount: data,
      idPayment: data.id,
      statusPayment: data.status,
      //leadAccountId: data.assetId,
      amount: data.amount,
      currency: data.assetType,
      amountCustodial: data.amountUSD,
      currencyCustodial: CurrencyCodeB2cryptoEnum.USD,
      operationType,
      typeTransaction: operation._id,
      typeAccount: wallet.accountType,
      account: wallet,
      crm,
      userAccount: wallet.owner,
      isApprove: isApproved,
      approvedAt: isApproved ? new Date() : null,
      rejectedAt: isApproved ? null : new Date(),
      userApprover: isApproved ? null : wallet.owner,
      userRejecter: isApproved ? null : wallet.owner,
      description: data.note,
    } as unknown as TransferCreateDto;
  }
}

/**
 *
{
"type": "TRANSACTION_CREATED",
"tenantId": "570e9a45-da12-5c4f-aace-1ad090b14bcc",
"timestamp": 1728869004528,
"data": {
  "id": "042f11a6-11f6-4517-b354-441b748f6406",
  "createdAt": 1728868173575,
  "lastUpdated": 1728868173597,
  "assetId": "TRX_USDT_S2UZ",
  "source": {
    "id": "",
    "type": "UNKNOWN",
    "name": "External",
    "subType": ""
  },
  "destination": {
    "id": "3",
    "type": "VAULT_ACCOUNT",
    "name": "66c380fe6ed3fd68b3d26f11-vault",
    "subType": ""
  },
  "amount": 10,
  "networkFee": 0,
  "netAmount": 10,
  "sourceAddress": "TNXoiAJ3dct8Fjg4M9fkLFh9S2v9TXc32G",
  "destinationAddress": "TEfbRgA6KFzfcYoVNiN1xha7sZ4GnLNioc",
  "destinationAddressDescription": "",
  "destinationTag": "",
  "status": "CONFIRMING",
  "txHash": "c14588d1428f3be316484223ae69f29b7e33e87ba81cac96d9b2582c17f5b245",
  "subStatus": "PENDING_BLOCKCHAIN_CONFIRMATIONS",
  "signedBy": [],
  "createdBy": "",
  "rejectedBy": "",
  "amountUSD": 9.99,
  "addressType": "",
  "note": "",
  "exchangeTxId": "",
  "requestedAmount": 10,
  "feeCurrency": "TRX",
  "operation": "TRANSFER",
  "customerRefId": null,
  "numOfConfirmations": 1,
  "amountInfo": {
    "amount": "10",
    "requestedAmount": "10",
    "netAmount": "10",
    "amountUSD": "9.99"
  },
  "feeInfo": {
    "networkFee": "0"
  },
  "destinations": [],
  "externalTxId": null,
  "blockInfo": {
    "blockHeight": "66073101",
    "blockHash": "0000000003f0320d93e1bf3bd0917d3dda6b2cf5ee80acd33f2a086b80f26f7c"
  },
  "signedMessages": [],
  "assetType": "TRON_TRC20"
}
 *
 */
