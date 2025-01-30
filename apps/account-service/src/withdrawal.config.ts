import { NetworkEnum } from "./enum/network.enum";


export const WITHDRAWAL_CONFIG = {
  timing: {
    minConfirmationTime: 120, // [2 minutes]
    maxConfirmationTime: 240, // [4 minutes]
  },
  fees: {
    base: 5,
    networks: {
      [NetworkEnum.ARBITRUM]: 0.05,
      [NetworkEnum.TRON]: 0.03,
    },
  },
  gasWallet: {
    address: process.env.GAS_WALLET_ADDRESS ?? '',
    minBalance: 100,
  },
} as const;