import { IsOptional, IsString } from 'class-validator';
import { UserResultInterface } from '../interface/card-result.interface';

export class UserResponseDto implements UserResultInterface {
  @IsString()
  @IsOptional()
  id: string;

  @IsString()
  @IsOptional()
  accountId?: string;
}
