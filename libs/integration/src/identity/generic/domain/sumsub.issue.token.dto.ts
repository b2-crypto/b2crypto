import { ApiProperty } from '@nestjs/swagger';
import { IsEmpty, IsEnum, IsInt, IsNotEmpty } from 'class-validator';
import { SumsubApplicantLevels } from './sumsub.enum';

export class SumsubIssueTokenDto {
  @IsEmpty()
  userId: string;

  @IsEnum(SumsubApplicantLevels)
  @IsNotEmpty()
  @ApiProperty({
    description: 'Verification level',
    enum: SumsubApplicantLevels,
  })
  levelName: SumsubApplicantLevels;

  @IsInt()
  @ApiProperty({
    description:
      'Time To Live - Form lifetime. Positive integer',
  })
  ttlInSecs: number;
}

export class SumsubIssuedTokenDto {
  token: string;
  userId: string;
  url: string;
}
