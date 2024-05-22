import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ApiProperty } from '@nestjs/swagger';
import { ObjectId } from 'mongodb';
import {
  IsCurrency,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { Transform } from 'class-transformer';

export class TransactionLeadCreateDto extends CreateAnyDto {
  @ApiProperty({
    description: 'id of lead in CRM',
  })
  @IsString()
  @IsNotEmpty()
  tpId: string;

  @ApiProperty({
    description: 'Transaction currency',
  })
  @IsEnum(CurrencyCodeB2cryptoEnum)
  @IsNotEmpty()
  currency: CurrencyCodeB2cryptoEnum;

  @ApiProperty({
    description:
      'Transaction amount. Must be the minimal unit of the currency.',
  })
  @IsCurrency({
    negative_sign_before_digits: false,
    thousands_separator: ',',
    decimal_separator: '.',
    allow_negatives: false,
    allow_decimal: false,
    symbol: '$',
  })
  @IsNotEmpty()
  @Transform(({ value }) => (value ? parseInt(value) : value))
  amount?: number;

  @ApiProperty({
    description: 'Transaction Psp id',
  })
  @IsMongoId()
  @IsNotEmpty()
  idPsp: ObjectId;

  @ApiProperty({
    description: 'Transaction Psp name',
  })
  @IsString()
  @IsOptional()
  namePsp: string;
}
