import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import GenderEnum from '@common/common/enums/GenderEnum';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { JobSchema } from '@person/person/entities/mongoose/job.schema';
import { KyCSchema } from '@person/person/entities/mongoose/kyc.schema';
import { LocationSchema } from '@person/person/entities/mongoose/location.schema';
import { TelephoneSchema } from '@person/person/entities/mongoose/telephone.schema';
import { PersonEntity } from '@person/person/entities/person.entity';
import { User } from '@user/user/entities/mongoose/user.schema';
import { ObjectId } from 'mongodb';
import * as mongoose from 'mongoose';
import { Document } from 'mongoose';

export type PersonDocument = Person & Document;

@Schema({
  timestamps: true,
})
export class Person extends PersonEntity {
  id: ObjectId;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description: string;

  @Prop()
  searchText: string;

  @Prop({ default: false })
  verifiedIdentity: boolean;

  @Prop()
  lastName: string;

  @Prop()
  email: string[];

  @Prop({ type: String, enum: CountryCodeEnum })
  nationality: CountryCodeEnum;

  @Prop({ type: String, enum: CountryCodeEnum })
  country: CountryCodeEnum;

  @Prop()
  taxIdentificationType: string;

  @Prop()
  taxIdentificationValue: number;

  @Prop([{ type: TelephoneSchema }])
  telephones: TelephoneSchema[];

  @Prop()
  phoneNumber: string;

  @Prop()
  numDocId: string;

  @Prop({ type: String, enum: DocIdTypeEnum })
  typeDocId: DocIdTypeEnum;

  @Prop({ type: LocationSchema })
  location: LocationSchema;

  @Prop({ type: JobSchema })
  job: JobSchema;

  @Prop({ type: Date })
  birth: Date;

  @Prop({ type: String, enum: GenderEnum })
  gender: GenderEnum;

  @Prop({ type: KyCSchema })
  kyc: KyCSchema;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'users' })
  user: User;
}

export const PersonSchema = SchemaFactory.createForClass(Person);
