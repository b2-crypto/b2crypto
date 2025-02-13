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
  networks: {
    [NetworkEnum.TRON]: {
      assetId: 'USDT_TRX',
      scanUrl: 'https://tronscan.org/#/address/',
      minAmount: 10,
      maxAmount: 100000,
    },
    [NetworkEnum.ARBITRUM]: {
      assetId: 'USDT_ARB',
      scanUrl: 'https://arbiscan.io/address/',
      minAmount: 10,
      maxAmount: 100000,
    }
  },
  gasWallet: {
    address: process.env.GAS_WALLET_ADDRESS ?? '',
    minBalance: 100,
  },
} as const;