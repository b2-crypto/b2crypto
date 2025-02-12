import { NetworkEnum } from "../enum/network.enum";

export interface QrDepositDto {
  vaultAccountId: string;
  amount: string;
  address?: string;
  description?: string;
  external?: boolean;
  network?: NetworkEnum;
}

