import { Account } from '@account/account/entities/mongoose/account.schema';
import { CommisionTypeEnum } from '@account/account/enum/commision-type.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Affiliate } from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { Brand } from '@brand/brand/entities/mongoose/brand.schema';
import { Category } from '@category/category/entities/mongoose/category.schema';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import { Lead } from '@lead/lead/entities/mongoose/lead.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { PspAccount } from '@psp-account/psp-account/entities/mongoose/psp-account.schema';
import { Psp } from '@psp/psp/entities/mongoose/psp.schema';
import { Status } from '@status/status/entities/mongoose/status.schema';
import { TransferAccountResponse } from '@transfer/transfer/dto/transfer.account.response.dto';
import { PspResponse } from '@transfer/transfer/dto/transfer.latamcashier.response.dto';
import {
  TransferRequestBodyJsonDto,
  TransferRequestHeadersJsonDto,
} from '@transfer/transfer/dto/transfer.request.dto';
import { TransferEntity } from '@transfer/transfer/entities/transfer.entity';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import mongoose, { Document, ObjectId } from 'mongoose';

export type TransferDocument = Transfer & Document;

@Schema()
export class CommisionDetail {
  @Prop()
  _id: ObjectId;

  @Prop()
  amount: number;

  @Prop()
  currency: string;

  @Prop()
  amountCustodial: number;

  @Prop()
  currencyCustodial: string;
}

export const CommisionDetailSchema =
  SchemaFactory.createForClass(CommisionDetail);

@Schema({
  timestamps: true,
})
export class Transfer extends TransferEntity {
  id: ObjectId;

  @Prop()
  numericId: number;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description: string;

  @Prop()
  searchText: string;
  // Amount in minimal units
  @Prop()
  amount: number;

  @Prop()
  amountCustodial: number;

  @Prop({ type: String, enum: CountryCodeEnum })
  country: CountryCodeEnum;

  @Prop()
  leadEmail: string;

  @Prop()
  leadTpId: string;

  @Prop()
  leadAccountId: string;

  @Prop()
  leadCrmName: string;

  @Prop()
  leadName: string;

  @Prop()
  leadTradingPlatformId: string;

  @Prop()
  crmTransactionId: string;

  @Prop({ type: JSON })
  crmTransactionResponse: JSON;

  @Prop()
  idPayment: string;

  @Prop()
  statusPayment: string;

  @Prop()
  descriptionStatusPayment: string;

  @Prop()
  urlPayment: string;

  @Prop({ type: PspResponse })
  responsePayment: PspResponse;

  @Prop({ type: TransferAccountResponse })
  responseAccount: TransferAccountResponse;

  @Prop({ type: TransferRequestBodyJsonDto })
  requestBodyJson: TransferRequestBodyJsonDto;

  @Prop({ type: TransferRequestHeadersJsonDto })
  requestHeadersJson: TransferRequestHeadersJsonDto;

  @Prop()
  confirmedAt: Date;

  @Prop()
  approvedAt: Date;

  @Prop()
  rejectedAt: Date;

  @Prop()
  isApprove: boolean;

  @Prop({ default: true })
  checkedOnCashier: boolean;

  @Prop()
  createdAt: Date;

  @Prop()
  updatedAt: Date;

  @Prop()
  hasChecked: boolean;

  @Prop({ type: String, enum: CurrencyCodeB2cryptoEnum })
  currency: CurrencyCodeB2cryptoEnum;

  @Prop({ type: String, enum: CurrencyCodeB2cryptoEnum })
  currencyCustodial: CurrencyCodeB2cryptoEnum;

  @Prop({ type: String, enum: OperationTransactionType })
  operationType: OperationTransactionType;

  @Prop({ type: String, enum: CountryCodeEnum })
  leadCountry: CountryCodeEnum;

  @Prop({ type: String, enum: TypesAccountEnum })
  typeAccount: TypesAccountEnum;

  @Prop()
  typeAccountType: string;

  @Prop()
  accountResultBalance: number;

  @Prop()
  accountPrevBalance: number;

  @Prop({ default: true })
  showToOwner: boolean;

  @Prop({
    type: String,
    enum: CommisionTypeEnum,
  })
  commisionType?: CommisionTypeEnum;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'leads' })
  lead: Lead;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'accounts' })
  account: Account;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'affiliates' })
  affiliate: Affiliate;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'statuses' })
  status: Status;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  bank: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  department: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  typeTransaction: Category;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'psp_accounts' })
  pspAccount: PspAccount;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'psps' })
  psp: Psp;

  //@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'psp_pages' })
  @Prop()
  page: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'brands' })
  brand: Brand;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'crms' })
  crm: Crm;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  userAccount: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  userCreator: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  userApprover: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  userRejecter: User;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'transfers' })
  parentTransaction?: Transfer;

  @Prop({ type: [mongoose.Schema.Types.ObjectId], ref: 'transfers' })
  commisions: Transfer[];

  @Prop({ type: [CommisionDetailSchema] })
  commisionsDetails: CommisionDetail[];
}

export const TransferSchema = SchemaFactory.createForClass(Transfer);
