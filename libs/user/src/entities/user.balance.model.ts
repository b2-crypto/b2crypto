export interface UserBalanceGenericModel {
  amount: number;
  currency: string;
}

export interface UserBalanceModel {
  wallets: UserBalanceGenericModel;
  cards: UserBalanceGenericModel;
  banks: UserBalanceGenericModel;
}
