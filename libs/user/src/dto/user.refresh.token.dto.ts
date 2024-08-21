import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UserRefreshTokenDto {
  @ApiProperty({
    description:
      'Refresh token. The user must send the expired bearer token as well',
    minLength: 6,
    maxLength: 50,
  })
  @IsString()
  refresh: string;
}
