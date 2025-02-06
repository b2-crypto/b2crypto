import { NetworkEnum } from "../enum/network.enum";

export interface QrDepositResponse {
  address: string;
  qrCode: string;
  network: NetworkEnum;
  scanUrl: string;
  amount: number;
  timestamp: Date;
}