
export interface WithdrawalResponse {
  transactionId: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  amount: number;
  fees: {
    networkFee: number;
    baseFee: number;
    totalFee: number;
  };
  timestamp: Date;
}