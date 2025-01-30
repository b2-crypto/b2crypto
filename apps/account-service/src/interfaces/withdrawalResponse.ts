export interface WithdrawalResponse {
    transactionId: string;
    status: string;
    amount: number;
    fee: number;
    totalAmount: number;
  }