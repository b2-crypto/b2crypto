import { Type } from 'class-transformer';
import { IsString, IsNotEmpty, IsInt } from 'class-validator';

export class SumsubIssueTokenDto {
  @IsString()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  levelName: string;

  @IsInt()
  @Type(() => Number)
  ttlInSecs: number;
}

export class SumsubIssuedTokenDto {
  token: string;
  userId: string;
  url: string;
}
