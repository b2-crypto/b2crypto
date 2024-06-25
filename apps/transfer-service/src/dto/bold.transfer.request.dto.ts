import { IsMongoId, IsNumber, IsOptional, IsString } from 'class-validator';
import { ObjectId } from 'mongoose';

export class BoldTransferRequestDto {
  @IsString()
  link_id: string;

  @IsString()
  @IsOptional()
  transaction_id: string;

  @IsNumber()
  total: number;

  @IsNumber()
  subtotal: number;

  @IsString()
  description: string;

  @IsMongoId()
  reference_id: ObjectId;

  @IsString()
  @IsOptional()
  payment_method: string;

  @IsString()
  @IsOptional()
  payer_email: string;

  @IsString()
  @IsOptional()
  transaction_date: string;

  @IsString()
  payment_status: string;
}
