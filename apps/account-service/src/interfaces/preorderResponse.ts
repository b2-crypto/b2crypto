import { NetworkEnum } from "../enum/network.enum";

export interface PreorderResponse {
  preorderId: string;
  totalAmount: number;
  fees: {
    networkFee: number;
    baseFee: number;
  };
  netAmount: number;
  expiresAt: Date;
}

export interface PreorderData {
  walletId: string;
  destinationAddress: string;
  amount: number;
  network: NetworkEnum;
  totalAmount: number;
  networkFee: number;
  baseFee: number;
  fees: {
    networkFee: number;
    baseFee: number;
  };
  createdAt: Date;
  executedAt?: Date;
  status?: string;
}