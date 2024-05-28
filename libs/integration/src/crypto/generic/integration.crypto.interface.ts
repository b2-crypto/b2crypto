// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { AxiosInstance, AxiosResponse } from 'axios';
import { DepositDto } from './dto/deposit.dto';
import { WalletDto } from './dto/wallet.dto';

export interface IntegrationCryptoInterface<
  TDepositDto = DepositDto,
  TWalletDto = WalletDto,
> {
  http: AxiosInstance;

  generateHttp();

  searchWallet(walletDto: TWalletDto): Promise<AxiosResponse<any[]>>;

  createDeposit(depositDto: TDepositDto): Promise<AxiosResponse<any[]>>;

  getDeposit(depositDto: TDepositDto): Promise<AxiosResponse<any[]>>;
}
