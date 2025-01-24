const WITHDRAWAL_CONFIG = {
    timing: {
      minConfirmationTime: 120,  // [2 minutes]
      maxConfirmationTime: 240,  // [4 minutes]
    },
    fees: {
      base: 5,
      networks: {
        arbitrum: 0.05,
        tron: 0.03
      }
    },
    gasWallet: {
        address:  process.env.GAS_WALLET_ADDRESS ?? '',
        minBalance: 100
      }
};