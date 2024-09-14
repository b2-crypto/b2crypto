export interface UserBalanceGenericModelData {
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
  all: UserBalanceGenericModel;
}
