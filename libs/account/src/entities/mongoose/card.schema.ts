import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export class AddressCard {
  @Prop()
  street_name: string;
  @Prop()
  street_number: string;
  @Prop()
  floor: string;
  @Prop()
  apartment: string;
  @Prop()
  city: string;
  @Prop()
  region: string;
  @Prop()
  country: string;
  @Prop()
  zip_code: string;
  @Prop()
  neighborhood: string;
}
export const AddressCardSchema = SchemaFactory.createForClass(AddressCard);

export class Card {
  @Prop()
  id: string;

  @Prop()
  user_id: string;

  @Prop()
  affinity_group_id: string;

  @Prop()
  card_type: string;

  @Prop({ type: AddressCardSchema })
  address: AddressCard;

  @Prop()
  previous_card_id: string;

  @Prop()
  pin: string;

  @Prop()
  name_on_card: string;

  @Prop()
  status: string;

  @Prop()
  start_date: Date;

  @Prop()
  last_four: string;

  @Prop()
  provider: string;

  @Prop()
  product_type: string;
}

@Schema()
export class CardSchema extends Card {}
