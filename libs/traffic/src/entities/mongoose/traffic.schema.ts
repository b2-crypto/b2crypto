import { Affiliate } from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { Category } from '@category/category/entities/mongoose/category.schema';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { Crm } from '@crm/crm/entities/mongoose/crm.schema';
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Person } from '@person/person/entities/mongoose/person.schema';
import { TrafficEntity } from '@traffic/traffic/entities/traffic.entity';
import mongoose, { Document } from 'mongoose';
import { Brand } from '../../../../brand/src/entities/mongoose/brand.schema';

export type TrafficDocument = Traffic & Document;

@Schema({
  timestamps: true,
})
export class Traffic extends TrafficEntity {
  id: string;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description: string;

  @Prop()
  searchText: string;

  @Prop({ type: Date })
  startDate: Date;

  @Prop({ type: Date })
  endDate: Date;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'traffics' })
  nextTraffic: Traffic;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'traffics' })
  prevTraffic: Traffic;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'persons' })
  person: Person;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'affiliates' })
  affiliate: Affiliate;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'crms' })
  crm: Crm;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'brands' })
  brand: Brand;

  @Prop({ type: [String] })
  blackListSources: string[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'categories' })
  blackListSourcesType: Category[];

  @Prop({ type: [String], enum: CountryCodeB2cryptoEnum })
  blackListCountries: CountryCodeB2cryptoEnum[];
}

export const TrafficSchema = SchemaFactory.createForClass(Traffic);
