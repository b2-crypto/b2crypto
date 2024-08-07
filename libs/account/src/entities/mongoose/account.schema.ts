import { AccountEntity } from '@account/account/entities/account.entity';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Affiliate } from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { Brand } from '@brand/brand/entities/mongoose/brand.schema';
import { Category } from '@category/category/entities/mongoose/category.schema';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import { Group } from '@group/group/entities/mongoose/group.schema';
import { ShippingResult } from '@integration/integration/card/generic/interface/shipping-result.interface';
import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Person } from '@person/person/entities/mongoose/person.schema';
import { Status } from '@status/status/entities/mongoose/status.schema';
import { User } from '@user/user/entities/mongoose/user.schema';
import * as mongoose from 'mongoose';
import { Document, ObjectId } from 'mongoose';
import { Card, CardSchema } from './card.schema';
import { UserCard, UserCardSchema } from './user-card.schema';

export type AccountDocument = Account & Document;

@Schema({
  timestamps: true,
})
export class Account extends AccountEntity {
  id: ObjectId;

  @Prop()
  searchText: string;

  @Prop()
  name: string;

  @Prop()
  firstName?: string;

  @Prop()
  lastName?: string;

  @Prop({ type: String, enum: TypesAccountEnum })
  type?: TypesAccountEnum;

  @Prop()
  docId: string;

  @Prop()
  pin: string;

  @Prop()
  email: string;

  @Prop()
  telephone: string;

  @Prop()
  accountId: string;

  @Prop()
  accountType: string;

  @Prop()
  accountName: string;

  @Prop()
  accountPassword: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  accountDepartment: Category;

  @Prop()
  description: string;

  @Prop()
  referral: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  owner: User;

  @Prop({ default: 0 })
  totalPayed: number;

  @Prop({ default: 0 })
  totalTransfer: number;

  @Prop({ default: 0 })
  quantityTransfer: number;

  @Prop({ default: 0 })
  amount: number;

  @Prop({ default: 0 })
  amountBlocked: number;

  @Prop()
  showToOwner: boolean;

  @Prop({
    type: String,
    enum: StatusAccountEnum,
    default: StatusAccountEnum.UNLOCK,
  })
  statusText: StatusAccountEnum;

  @Prop()
  hasSendDisclaimer: boolean;

  @Prop({ type: String, enum: CountryCodeB2cryptoEnum })
  country: CountryCodeB2cryptoEnum;

  @Prop()
  referralType: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'groups' })
  group: Group;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'statuses' })
  status: Status;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'statuses' }] })
  accountStatus: Status[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'persons' })
  personalData: Person;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'crms' })
  crm: Crm;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'brands' })
  brand: Brand;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'affiliates' })
  affiliate: Affiliate;

  @Prop()
  userIp?: string;

  @Prop()
  audience?: string;

  @Prop()
  grantType?: string;

  @Prop()
  url?: string;

  @Prop()
  secret?: string;

  @Prop()
  responseCreation?: string;

  @Prop(raw(ShippingResult))
  responseShipping?: ShippingResult;

  @Prop({ type: UserCardSchema })
  userCardConfig?: UserCard;

  @Prop({ type: CardSchema })
  cardConfig?: Card;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'accounts' })
  prevAccount: Account;
}

export const AccountSchema = SchemaFactory.createForClass(Account);
