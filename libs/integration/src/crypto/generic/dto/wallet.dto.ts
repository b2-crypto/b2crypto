import { IsOptional, IsString } from 'class-validator';

export class WalletDto {
  @IsString()
  @IsOptional()
  id: string;
}
