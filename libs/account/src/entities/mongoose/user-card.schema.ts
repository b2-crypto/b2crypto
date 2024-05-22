import { Prop, SchemaFactory } from '@nestjs/mongoose';

export class AddressUserCard {
  @Prop()
  street_name: string;
  @Prop()
  street_number: number;
  @Prop()
  floor: number;
  @Prop()
  apartment: string;
  @Prop()
  zip_code: number;
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
}

export const AddressUserCardSchema =
  SchemaFactory.createForClass(AddressUserCard);

export class UserCard {
  @Prop()
  id: string;

  @Prop()
  name: string;

  @Prop()
  surname: string;

  @Prop()
  identification_type: string;

  @Prop()
  identification_value: number;

  @Prop()
  birthdate: string;

  @Prop()
  gender: string;

  @Prop()
  email: string;

  @Prop()
  phone: string;

  @Prop()
  tax_identification_type: string;

  @Prop()
  tax_identification_value: number;

  @Prop()
  nationality: string;

  @Prop({ type: AddressUserCardSchema })
  legal_address: AddressUserCard;

  @Prop()
  operation_country: string;
}

export const UserCardSchema = SchemaFactory.createForClass(UserCard);
