import {
  IsLatitude,
  IsLongitude,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import GeopointModel from '@common/common/models/GeopointModel';
import { ApiProperty } from '@nestjs/swagger';

export default class GeopointDto implements GeopointModel {
  @ApiProperty({
    required: true,
    type: String,
    description: 'Name of the geopoint',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Description of the geopoint',
  })
  @IsString()
  @IsOptional()
  description: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Latitude of the geopoint',
  })
  @IsLatitude()
  @IsNotEmpty()
  latitude: string;

  @ApiProperty({
    required: true,
    type: String,
    description: 'Longitude of the geopoint',
  })
  @IsNotEmpty()
  @IsLongitude()
  longitude: string;
}
