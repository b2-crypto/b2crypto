import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { DepositDto } from '../generic/dto/deposit.dto';
import { WalletDto } from '../generic/dto/wallet.dto';
import { IntegrationCryptoService } from '../generic/integration.crypto.service';

export class B2BinPayIntegrationService extends IntegrationCryptoService<
  // DTO
  DepositDto,
  WalletDto
> {
  constructor(
    @InjectPinoLogger(B2BinPayIntegrationService.name)
    protected readonly logger: PinoLogger,
    public account: AccountDocument,
    protected configService: ConfigService,
    protected cacheManager: Cache,
  ) {
    super(logger, account, configService, cacheManager);
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
}
