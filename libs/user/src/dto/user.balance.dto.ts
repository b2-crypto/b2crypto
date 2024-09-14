import { Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';

export class UserBalanceGenericDataDto {
  @IsNumber()
  @IsOptional()
  amount = 0;

  @IsString()
  @IsOptional()
  currency: string;
}

export class UserBalanceGenericDto {
  [accountType: string]: UserBalanceGenericDataDto;
}

export class UserBalanceDto {
  @Type(() => UserBalanceGenericDto)
  @IsOptional()
  wallets: UserBalanceGenericDto;

  @Type(() => UserBalanceGenericDto)
  @IsOptional()
  cards: UserBalanceGenericDto;

  @Type(() => UserBalanceGenericDto)
  @IsOptional()
  banks: UserBalanceGenericDto;

  @Type(() => UserBalanceGenericDto)
  @IsOptional()
  all: UserBalanceGenericDto;
}
