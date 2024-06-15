import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { ScopeDto } from '@permission/permission/dto/scope.dto';
import TransportEnum from '@common/common/enums/TransportEnum';
import { Type } from 'class-transformer';
import { ObjectId } from 'mongodb';
import {
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { VarsMessageTemplate } from '@message/message/entities/mongoose/message.schema';

export class MessageCreateDto extends CreateAnyDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsString()
  description: string;

  @IsString()
  @IsNotEmpty()
  body: string;

  @IsOptional()
  @IsMongoId()
  category: ObjectId;

  @IsOptional()
  @Type(() => ScopeDto)
  origin: ScopeDto;

  @IsString()
  @IsOptional()
  originText: string;

  @IsOptional()
  @Type(() => ScopeDto)
  destiny: ScopeDto;

  @IsOptional()
  @Type(() => VarsMessageTemplate)
  vars: VarsMessageTemplate;

  @IsString()
  @IsOptional()
  destinyText: string;

  @IsNotEmpty()
  @IsMongoId()
  status: ObjectId;

  @IsOptional()
  @IsMongoId()
  creator: ObjectId;

  @IsNotEmpty()
  @IsEnum(TransportEnum)
  transport: TransportEnum;
}
