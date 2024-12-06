import { PartialType } from '@nestjs/swagger';
import { PersonCreateDto } from './person.create.dto';
import { IsDate, IsMongoId, IsOptional, ValidateNested } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Type } from 'class-transformer';
import LocationDto from './location.dto';

export class PersonUpdateDto extends PartialType(PersonCreateDto) {
  @IsMongoId()
  @IsOptional()
  id: ObjectId;

  @IsOptional()
  @IsDate()
  birth?: Date;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  verifiedIdentity?: boolean;
}
