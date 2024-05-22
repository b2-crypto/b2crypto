import { IsOptional, IsString } from 'class-validator';
import { UserResultInterface } from '../interface/crypto-result.interface';

export class TrackVisitDto implements UserResultInterface {
  @IsString()
  @IsOptional()
  id: string;
}
