import {
  UserCard,
  UserCardSchema,
} from '@account/account/entities/mongoose/user-card.schema';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { FileInterface } from '@file/file/entities/file.interface';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Permission } from '@permission/permission/entities/mongoose/permission.schema';
import { Person } from '@person/person/entities/mongoose/person.schema';
import { Role } from '@role/role/entities/mongoose/role.schema';
import UserVerifyIdentityDto from '@user/user/dto/user.verify.identity.dto';
import { UserEntity } from '@user/user/entities/user.entity';
import mongoose, { Document, ObjectId } from 'mongoose';
import { UserVerifyIdentitySchema } from './user.verify.identity.schema';
import { UserBalanceModel } from '../user.balance.model';
import { UserBalance } from './user.balance.schema';

export type UserDocument = User & Document;

@Schema({
  timestamps: true,
  optimisticConcurrency: true,
  // TODO[hender - 2024/02/21] Not execute update password
  statics: {
    setPassword: UserEntity.changePassword,
  },
})
export class User extends UserEntity {
  id: ObjectId;
  @Prop({ unique: true })
  email: string;

  @Prop({ unique: true })
  slugEmail: string;

  @Prop()
  searchText: string;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description: string;

  @Prop({ unique: true })
  username: string;

  @Prop({ unique: true })
  slugUsername: string;

  @Prop()
  password: string;

  @Prop()
  confirmPassword?: string;

  @Prop({ default: true })
  active: boolean;

  @Prop({ default: true })
  individual: boolean;

  @Prop()
  isClientAPI: boolean;

  @Prop({ default: false })
  inMaintenance: boolean;

  @Prop({ default: null })
  maintenanceAt: Date;

  @Prop({ default: null })
  maintenanceStartAt: Date;

  @Prop({ default: null })
  maintenanceEndAt: Date;

  @Prop({ type: UserBalance })
  balance: UserBalance;

  @Prop()
  apiKey: string;

  @Prop({ type: Object })
  configuration: JSON;

  @Prop()
  twoFactorSecret: string;

  @Prop()
  twoFactorQr: string;

  @Prop()
  twoFactorIsActive: boolean;

  @Prop()
  amountCustodial: number;

  @Prop({ default: false })
  verifyIdentity: boolean;

  @Prop()
  verifyIdentityTtl: number;

  @Prop()
  verifyIdentityCode: string;

  @Prop()
  verifyIdentityStatus: string;

  @Prop()
  verifyIdentityLevelName: string;

  @Prop()
  verifyIdentityExpiredAt: Date;

  @Prop({ type: UserVerifyIdentitySchema })
  verifyIdentityResponse: UserVerifyIdentitySchema;

  @Prop({ type: String })
  currencyCustodial: CurrencyCodeB2cryptoEnum;

  @Prop({ type: [String] })
  authorizations: Array<string>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'files' })
  image: FileInterface;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'roles' })
  role: Role;

  @Prop({
    type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'permissions' }],
  })
  permissions: Array<Permission>;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'persons' })
  personalData: Person;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'affiliates' })
  userParent: User;

  @Prop({ type: UserCardSchema })
  userCard?: UserCard;

  @Prop()
  verifyEmail?: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);
