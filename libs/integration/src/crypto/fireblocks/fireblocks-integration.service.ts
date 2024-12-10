import { Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { DepositDto } from '../generic/dto/deposit.dto';
import { WalletDto } from '../generic/dto/wallet.dto';
import { IntegrationCryptoService } from '../generic/integration.crypto.service';
import {
  Fireblocks,
  FireblocksResponse,
  TransactionResponse,
  TransactionStateEnum,
  TransferPeerPathType,
} from '@fireblocks/ts-sdk';
import { Logger } from '@nestjs/common';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';

enum FireblocksEnvirormentStage {
basePath = 'https://sandbox-api.fireblocks.io/v1',
secretKeyPath = './secret.key',
  apiKey = 'xpub661MyMwAqRbcGenBxs6DqTr6rbGVLVuxS9HzhMvhZQuezEQDKUunabkstEqhjHWPJRqHg57iqucTEXwnCYSx4XqSB8xjaybuoNivrTn8mzM',
}
enum FireblocksEnvirormentProd {
  basePath = 'https://sandbox-api.fireblocks.io/v1',
  secretKeyPath = './secret.key',
    apiKey = 'ff89b0e3-e827-4ba3-93b2-a834fd9b4724',
}

export class FireblocksIntegrationService extends IntegrationCryptoService<
  // DTO
  DepositDto,
  WalletDto
> {

  private readonly FIREBLOCKS_API_SECRET_PATH = './secret.key';
  private fireblocks: Fireblocks;
  private basePath: string;
  private apiKeyFireblocks: string;
  constructor(
    protected configService: ConfigService,
    protected cacheManager: Cache,
  ) {
    super(null, configService, cacheManager);
    this.setRouteMap({
      // Auth
      auth: '/token',
      // User
      createUser: null,
      updateUser: null,
      searchUser: null,
      getUser: null,
      // Wallet
      createWallet: null,
      updateWallet: null,
      getWallet: '/wallet/{id}',
      // Deposit
      createDeposit: '/deposit',
      getDeposit: '/deposit/{id}',
      getTransferByDeposit: '/transfer',
    });
    this.basePath = this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod ? FireblocksEnvirormentProd.basePath : FireblocksEnvirormentStage.basePath;
    this.apiKeyFireblocks = this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod ? FireblocksEnvirormentProd.apiKey : FireblocksEnvirormentStage.apiKey;
  }

  async getFireblocks() {
    return this.fireblocks;
  }
  generateHttp(): Promise<void> {
    if (!this.fireblocks) {
      this.fireblocks = new Fireblocks({
        apiKey: this.apiKeyFireblocks,
        basePath: this.basePath,
        secretKey: this.getSecret(),
      });
    }
    return Promise.resolve();
  }
  async getAvailablerWallets(): Promise<WalletDto[]> {
    try {
      const assetsActives = await this.fireblocks.vaults.getVaultAssets();
      const assetsAvailables =
        await this.fireblocks.blockchainsAssets.getSupportedAssets();
      return assetsActives.data.map((wallet) => {
        const asset = assetsAvailables.data.filter(
          (asset) => asset.id === wallet.id,
        )[0];
        return {
          id: undefined,
          name: asset.name,
          accountId: asset.id,
          accountName: asset.contractAddress,
          referral: asset['issuerAddress'],
          protocol: asset.type,
          decimals: asset.decimals,
          nativeAccountName: asset.nativeAsset,
          showToOwner: false,
        };
      });
    } catch (e) {
      Logger.error(e);
    }
  }
  // creating a new vault account
  async createVault(vaultName: string, hiddenOnUI = false) {
    try {
      const vaultOld = await this.fireblocks.vaults.getPagedVaultAccounts({
        namePrefix: vaultName,
      });
      if (vaultOld.data.accounts.length) {
        return vaultOld.data.accounts[0];
      }
      const vault = await this.fireblocks.vaults.createVaultAccount({
        createVaultAccountRequest: {
          name: vaultName,
          hiddenOnUI,
          autoFuel: true, // Because gas station is enable
        },
      });
      Logger.debug(JSON.stringify(vault.data, null, 2), 'createVault');
      return vault.data;
    } catch (e) {
      Logger.debug(e);
    }
  }
  // creating a new vault account
  async createWallet(
    vaultId: string,
    assetId: string,
    walletName?: string,
    customerId?: string,
  ) {
    try {
      const data = {
        vaultAccountId: vaultId,
        assetId: assetId,
        createAddressRequest: undefined,
      };
      let walletUser = null;
      if (walletName) {
        data.createAddressRequest = {
          description: walletName,
          customerRefId: customerId,
        };
        walletUser =
          await this.fireblocks.vaults.createVaultAccountAssetAddress(data);
      } else {
        walletUser = await this.fireblocks.vaults.createVaultAccountAsset(data);
      }

      Logger.debug(JSON.stringify(walletUser, null, 2), 'createWallet');
      return walletUser.data;
    } catch (e) {
      if (e.message.indexOf('not found') > -1) {
        await this.createWallet(vaultId, assetId);
        return this.createWallet(vaultId, assetId, walletName, customerId);
      }
      Logger.error(e.message, 'createWallet');
      throw e;
    }
  }

  //retrive vault accounts
  async getVaultPagedAccounts(limit: number) {
    try {
      const vaults = await this.fireblocks.vaults.getPagedVaultAccounts({
        limit,
      });
      Logger.debug(JSON.stringify(vaults.data, null, 2));
    } catch (e) {
      Logger.debug(e);
    }
  }

  async validateAddress(assetId: string, address: string) {
    try {
      const rta = await this.fireblocks.transactions.validateAddress({
        assetId,
        address,
      });
      Logger.debug(JSON.stringify(rta.data, null, 2));
    } catch (e) {
      Logger.debug(e);
    }
  }

  // create a transaction
  async createTransaction(
    assetId: string,
    amount: string,
    srcId: string,
    destId: string,
    note?: string,
    external = false,
  ) {
    const payload = {
      assetId,
      amount,
      source: {
        type: TransferPeerPathType.VaultAccount,
        id: String(srcId),
      },
      destination: {
        type: TransferPeerPathType.VaultAccount,
        id: String(destId),
        oneTimeAddress: undefined,
      },
      note: note,
    };
    if (external) {
      payload.destination = {
        id: undefined,
        type: TransferPeerPathType.OneTimeAddress as any,
        oneTimeAddress: {
          address: String(destId),
        },
      };
    }
    const result = await this.fireblocks.transactions.createTransaction({
      transactionRequest: payload,
    });
    Logger.debug(JSON.stringify(result, null, 2));
    return result;
  }
  async getTxStatus(txId: string): Promise<TransactionStateEnum | string> {
    try {
      const response: FireblocksResponse<TransactionResponse> =
        await this.fireblocks.transactions.getTransaction({ txId });
      const tx: TransactionResponse = response.data;
      const messageToConsole = `Transaction ${tx.id} is currently at status - ${tx.status}`;

      if (!tx) {
        return 'Transaction does not exist';
      }

      Logger.debug(messageToConsole);
      // while (tx.status !== TransactionStateEnum.Completed) {
      //   await new Promise((resolve) => setTimeout(resolve, 3000));

      //   response = await this.fireblocks.transactions.getTransaction({ txId });
      //   tx = response.data;

      //   switch (tx.status) {
      //     case TransactionStateEnum.Blocked:
      //     case TransactionStateEnum.Cancelled:
      //     case TransactionStateEnum.Failed:
      //     case TransactionStateEnum.Rejected:
      //       throw new Error(
      //         `Signing request failed/blocked/cancelled: Transaction: ${tx.id} status is ${tx.status}`,
      //       );
      //     default:
      //       Logger.debug(messageToConsole);
      //       break;
      //   }
      // }

      return tx.status;
    } catch (error) {
      throw error;
    }
  }

  async resendNotifications() {
    return this.fireblocks.webhooks.resendWebhooks();
  }

  private getSecret() {
    //return readFileSync(this.FIREBLOCKS_API_SECRET_PATH, 'utf8');
    return `-----BEGIN PRIVATE KEY-----
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
Zkx5ujM5LdHTBjrq0M6Qjmy6UjxGGOQ=
-----END PRIVATE KEY-----
`;
  }
}
