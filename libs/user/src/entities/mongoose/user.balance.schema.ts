import { Prop } from '@nestjs/mongoose';

class UserBalanceGeneric {
  @Prop()
  amount: 0;
  @Prop()
  currency: 'USDT';
}

export class UserBalance {
  @Prop({ type: UserBalanceGeneric })
  wallets: UserBalanceGeneric;
  @Prop({ type: UserBalanceGeneric })
  cards: UserBalanceGeneric;
}
