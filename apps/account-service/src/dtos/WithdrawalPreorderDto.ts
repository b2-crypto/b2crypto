import { NetworkEnum } from "../enum/network.enum";

export interface WithdrawalPreorderDto {
  walletId: string;
  destinationAddress: string;
  amount: number;
  network: NetworkEnum;
}