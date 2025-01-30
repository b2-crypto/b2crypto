import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { WithdrawalPreorderDto } from './WithdrawalPreorderDto';

export class WithdrawalExecuteDto extends WithdrawalPreorderDto {
  @ApiProperty({
    description: 'ID of the preorder to execute',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  @IsNotEmpty()
  @IsString()
  preorderId: string;
}