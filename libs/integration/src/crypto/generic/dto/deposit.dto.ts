import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

export class DepositDto {
  data: DataCreateDepositDto;
}

export class DataCreateDepositDto {
  @IsString()
  type: string;
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => AttributesDepositDto)
  attributes: AttributesDepositDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => RelationshipsDepositDto)
  relationships: RelationshipsDepositDto;
}

export class AttributesDepositDto {
  @IsString()
  label: string;

  @IsString()
  tracking_id: string;

  @IsString()
  target_amount_requested: string;

  @IsNumber()
  confirmations_needed: number;

  @IsString()
  callback_url: string;
}

export class RelationshipsDepositDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => WalletDepositDto)
  wallet: WalletDepositDto;
}

export class WalletDepositDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => DataWalletDepositDto)
  data: DataWalletDepositDto;
}

export class DataWalletDepositDto {
  @IsString()
  type: string;

  @IsString()
  id: string;
}
