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
    const isVerified = this.verifySign(req);
    if (isVerified) {
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
        if (!tx) {
          const dto = await this.getTransferDto(rta);
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
        tx.statusPayment = rta.status;
      }
    }
    return isVerified ? 'ok' : 'fail';
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
    Logger.debug(JSON.stringify(data, null, 2), 'getTransferDto');
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
 * "type": "TRANSACTION_CREATED",
 * "timestamp": 1728857033697,
//! Gas station CREATED
{
1|b2crypto-gateway        |   "type": "TRANSACTION_CREATED",
1|b2crypto-gateway        |   "tenantId": "570e9a45-da12-5c4f-aace-1ad090b14bcc",
1|b2crypto-gateway        |   "timestamp": 1728857019639,
1|b2crypto-gateway        |   "data": {
1|b2crypto-gateway        |     "id": "c950c5ff-ea37-4d49-8ba2-41a22400097a",
1|b2crypto-gateway        |     "createdAt": 1728857003735,
1|b2crypto-gateway        |     "lastUpdated": 1728857003735,
1|b2crypto-gateway        |     "assetId": "TRX",
1|b2crypto-gateway        |     "source": {
1|b2crypto-gateway        |       "id": "2",
1|b2crypto-gateway        |       "type": "VAULT_ACCOUNT",
1|b2crypto-gateway        |       "name": "GasStation",
1|b2crypto-gateway        |       "subType": ""
1|b2crypto-gateway        |     },
1|b2crypto-gateway        |     "destination": {
1|b2crypto-gateway        |       "id": "3",
1|b2crypto-gateway        |       "type": "VAULT_ACCOUNT",
1|b2crypto-gateway        |       "name": "66c380fe6ed3fd68b3d26f11-vault",
1|b2crypto-gateway        |       "subType": ""
1|b2crypto-gateway        |     },
1|b2crypto-gateway        |     "amount": 60,
1|b2crypto-gateway        |     "sourceAddress": "",
1|b2crypto-gateway        |     "destinationAddress": "",
1|b2crypto-gateway        |     "destinationAddressDescription": "",
1|b2crypto-gateway        |     "destinationTag": "",
1|b2crypto-gateway        |     "status": "SUBMITTED",
1|b2crypto-gateway        |     "txHash": "",
1|b2crypto-gateway        |     "subStatus": "",
1|b2crypto-gateway        |     "signedBy": [],
1|b2crypto-gateway        |     "createdBy": "gas-station",
1|b2crypto-gateway        |     "rejectedBy": "",
1|b2crypto-gateway        |     "amountUSD": 9.74,
1|b2crypto-gateway        |     "addressType": "",
1|b2crypto-gateway        |     "note": "Gas Tank auto-fuel",
1|b2crypto-gateway        |     "exchangeTxId": "",
1|b2crypto-gateway        |     "requestedAmount": 60,
1|b2crypto-gateway        |     "feeCurrency": "TRX",
1|b2crypto-gateway        |     "operation": "TRANSFER",
1|b2crypto-gateway        |     "customerRefId": null,
1|b2crypto-gateway        |     "amountInfo": {
1|b2crypto-gateway        |       "amount": "60",
1|b2crypto-gateway        |       "requestedAmount": "60",
1|b2crypto-gateway        |       "amountUSD": "9.74"
1|b2crypto-gateway        |     },
1|b2crypto-gateway        |     "feeInfo": {},
1|b2crypto-gateway        |     "destinations": [],
1|b2crypto-gateway        |     "externalTxId": null,
1|b2crypto-gateway        |     "blockInfo": {},
1|b2crypto-gateway        |     "signedMessages": [],
1|b2crypto-gateway        |     "assetType": "BASE_ASSET"
1|b2crypto-gateway        |   }
1|b2crypto-gateway        | }

//! CREATED
{
  "type": "TRANSACTION_CREATED",
  "tenantId": "570e9a45-da12-5c4f-aace-1ad090b14bcc",
  "timestamp": 1728857299238,
  "data": {
    "id": "f1c3d97d-8f50-48bb-bc44-45574bbffb88",
    "createdAt": 1728857003108,
    "lastUpdated": 1728857003160,
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
    "txHash": "b649cec48056922620aaa4e696d5db7b6bd5799e1c9f055fd2b08e00ed6cc342",
    "subStatus": "PENDING_BLOCKCHAIN_CONFIRMATIONS",
    "signedBy": [],
    "createdBy": "",
    "rejectedBy": "",
    "amountUSD": 10,
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
      "amountUSD": "10.00"
    },
    "feeInfo": {
      "networkFee": "0"
    },
    "destinations": [],
    "externalTxId": null,
    "blockInfo": {
      "blockHeight": "66069380",
      "blockHash": "0000000003f02384c401227153d8ef00ed71da66a7860e9805115d05654e8a60"
    },
    "signedMessages": [],
    "assetType": "TRON_TRC20"
  }
}

//! SUBMITED

 * 
 */
