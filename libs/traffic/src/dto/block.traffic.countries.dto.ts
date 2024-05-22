import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { IsArray, IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class BlockTrafficCountriesDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsArray()
  @IsNotEmpty()
  @IsEnum({ each: true })
  countries: CountryCodeEnum[];
}
