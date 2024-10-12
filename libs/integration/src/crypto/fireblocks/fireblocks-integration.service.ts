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
import { readFileSync } from 'fs';
import { Logger } from '@nestjs/common';

export class FireblocksIntegrationService extends IntegrationCryptoService<
  // DTO
  DepositDto,
  WalletDto
> {
  private readonly FIREBLOCKS_API_SECRET_PATH = './secret.key';
  private fireblocks: Fireblocks;
  private basePath = {
    production: 'https://api.fireblocks.io/v1',
    sandbox: 'https://sandbox-api.fireblocks.io/v1',
  };
  constructor(
    protected configService: ConfigService,
    protected cacheManager: Cache,
  ) {
    super(null, configService, cacheManager);
    this.fireblocks = new Fireblocks({
      apiKey: 'ff89b0e3-e827-4ba3-93b2-a834fd9b4724',
      basePath: this.basePath.production,
      secretKey: readFileSync(this.FIREBLOCKS_API_SECRET_PATH, 'utf8'),
    });
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
  }

  async getFireblocks() {
    return this.fireblocks;
  }
  // creating a new vault account
  async createVault(vaultName: string, hiddenOnUI = false) {
    try {
      const vault = await this.fireblocks.vaults.createVaultAccount({
        createVaultAccountRequest: {
          name: vaultName,
          hiddenOnUI,
          autoFuel: true, // Because gas station is enable
        },
      });
      Logger.debug(JSON.stringify(vault.data, null, 2));
    } catch (e) {
      Logger.debug(e);
    }
  }
  // creating a new vault account
  async createWallet(vaultId: string, assetId: string) {
    try {
      const vaultWallet = await this.fireblocks.vaults.createVaultAccountAsset({
        vaultAccountId: vaultId,
        assetId: assetId,
      });

      Logger.debug(JSON.stringify(vaultWallet, null, 2));
    } catch (e) {
      Logger.debug(e);
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

  // create a transaction
  async createTransaction(assetId, amount, srcId, destId) {
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
      },
      note: 'Your first transaction!',
    };
    const result = await this.fireblocks.transactions.createTransaction({
      transactionRequest: payload,
    });
    Logger.debug(JSON.stringify(result, null, 2));
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
}
