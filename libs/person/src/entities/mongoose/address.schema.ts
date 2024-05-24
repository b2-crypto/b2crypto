import AddressModel from '@common/common/models/AddressModel';
import { Prop, Schema } from '@nestjs/mongoose';

@Schema()
export class AddressSchema implements AddressModel {
  @Prop()
  street_name: string;

  @Prop()
  street_number: string;

  @Prop()
  floor: string;

  @Prop()
  zip_code: string;

  @Prop()
  apartment: string;

  @Prop()
  neighborhood: string;

  @Prop()
  city: string;

  @Prop()
  region: string;

  @Prop()
  additional_info: string;

  @Prop()
  country: string;

  @Prop()
  name: string;

  @Prop()
  slug: string;

  @Prop()
  description: string;

  @Prop()
  searchText: string;
}
