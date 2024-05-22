import { PartialType } from '@nestjs/mapped-types';
import { TrafficCreateDto } from './traffic.create.dto';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';

export class TrafficUpdateDto extends PartialType(TrafficCreateDto) {
  @IsString()
  id: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  blackListSources?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  blackListSourcesType?: string[];

  @IsArray()
  @IsOptional()
  @IsEnum(CountryCodeB2cryptoEnum, { each: true })
  blackListCountries?: CountryCodeB2cryptoEnum[];
}
