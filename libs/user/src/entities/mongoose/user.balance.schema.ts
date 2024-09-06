import { Prop } from '@nestjs/mongoose';

class UserBalanceGeneric {
  @Prop({ default: 0 })
  amount: 0;
  @Prop({ default: 'USDT' })
  currency: 'USDT';
}

export class UserBalance {
  @Prop({ type: UserBalanceGeneric })
  wallets: UserBalanceGeneric;
  @Prop({ type: UserBalanceGeneric })
  cards: UserBalanceGeneric;
}
