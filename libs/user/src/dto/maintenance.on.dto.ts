import { IsDate, IsOptional } from 'class-validator';

export class MaintenanceOnDto {
  @IsDate()
  @IsOptional()
  dateStart: Date;

  @IsDate()
  @IsOptional()
  dateEnd: Date;
}
