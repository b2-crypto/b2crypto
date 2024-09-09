import { Prop } from '@nestjs/mongoose';
import {
  UserBalanceGenericModel,
  UserBalanceModel,
} from '../user.balance.model';

class UserBalanceGeneric implements UserBalanceGenericModel {
  @Prop({ default: 0 })
  amount: number;
  @Prop({ default: 'NA' })
  currency: string;
}

export class UserBalance implements UserBalanceModel {
  @Prop({ type: UserBalanceGeneric })
  wallets: UserBalanceGeneric;
  @Prop({ type: UserBalanceGeneric })
  cards: UserBalanceGeneric;
  @Prop({ type: UserBalanceGeneric })
  banks: UserBalanceGeneric;
}
