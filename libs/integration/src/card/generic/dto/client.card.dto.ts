import { IsOptional, IsString } from 'class-validator';

export class ClientCardDto {
  @IsString()
  @IsString()
  @IsOptional()
  id: string;
  secret: string;
  audience: string;
  grantType: string;
  url: string;
}
