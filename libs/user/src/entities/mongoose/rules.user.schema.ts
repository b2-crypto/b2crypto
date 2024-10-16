import { Prop } from '@nestjs/mongoose';
import { RulesUserModel } from '../rules.user.model';

export class RulesUser implements RulesUserModel {
  @Prop()
  _id: string;
  @Prop()
  name: string;
  @Prop()
  description: string;
  @Prop()
  valueNumber: number;
  @Prop()
  valueText: string;
  @Prop()
  rules: [RulesUser];
}
