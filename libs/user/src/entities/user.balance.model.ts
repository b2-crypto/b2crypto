export interface UserBalanceGenericModelData {
  accountType: string;
  quantity: number;
  amount: number;
  currency: string;
}
export interface UserBalanceGenericModel {
  [accountType: string]: UserBalanceGenericModelData;
}

export interface UserBalanceModel {
  wallets: UserBalanceGenericModel;
  cards: UserBalanceGenericModel;
  banks: UserBalanceGenericModel;
  ALL: UserBalanceGenericModelData;
}
