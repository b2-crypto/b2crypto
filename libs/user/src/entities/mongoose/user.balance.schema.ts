import { Prop } from '@nestjs/mongoose';
import {
  UserBalanceGenericModel,
  UserBalanceGenericModelData,
  UserBalanceModel,
} from '../user.balance.model';

class UserBalanceGenericData implements UserBalanceGenericModelData {
  @Prop({ default: 0 })
  amount: number;
  @Prop({ default: 'NA' })
  currency: string;
  @Prop({ default: 'NA' })
  accountType: string;
  @Prop({ default: 0 })
  quantity: number;
}

class UserBalanceGeneric implements UserBalanceGenericModel {
  [accountType: string]: UserBalanceGenericData;
}

export class UserBalance implements UserBalanceModel {
  @Prop({ type: UserBalanceGeneric })
  wallets: UserBalanceGeneric;
  @Prop({ type: UserBalanceGeneric })
  cards: UserBalanceGeneric;
  @Prop({ type: UserBalanceGeneric })
  banks: UserBalanceGeneric;
  @Prop({ type: UserBalanceGenericData })
  ALL: UserBalanceGenericData;
}
