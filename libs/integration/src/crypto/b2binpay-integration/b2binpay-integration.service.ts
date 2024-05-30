import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { ConfigService } from '@nestjs/config';
import { DepositDto } from '../generic/dto/deposit.dto';
import { WalletDto } from '../generic/dto/wallet.dto';
import { IntegrationCryptoService } from '../generic/integration.crypto.service';

export class B2BinPayIntegrationService extends IntegrationCryptoService<
  // DTO
  DepositDto,
  WalletDto
> {
  constructor(
    public account: AccountDocument,
    protected configService: ConfigService,
  ) {
    super(account, configService);
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
    });
  }
}
