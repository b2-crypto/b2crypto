import { NetworkEnum } from "../enum/network.enum";

export interface QrDepositDto {
    walletId: string;
    network: NetworkEnum;
    amount: number;
  }