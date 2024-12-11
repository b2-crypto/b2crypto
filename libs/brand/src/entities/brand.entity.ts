import { BrandInterface } from 'libs/brand/src/entities/brand.interface';
import { CategoryEntity } from '@category/category/entities/category.entity';
import { CrmEntity } from '@crm/crm/entities/crm.entity';
import { ApiProperty } from '@nestjs/swagger';
import { PspEntity } from '@psp/psp/entities/psp.entity';
import { StatusEntity } from '@status/status/entities/status.entity';
import { ObjectId } from 'mongodb';
import { UserEntity } from '@user/user/entities/user.entity';

export class BrandEntity implements BrandInterface {
  _id?: ObjectId;
  id: ObjectId;
  @ApiProperty({
    type: String,
    description: 'Name of the Brand',
  })
  name: string;
  idCashier: string;
  @ApiProperty({
    type: String,
    description: 'Description of the Brand',
  })
  slug: string;
  description: string;
  searchText: string;
  quantityLeads: number;
  totalLeads: number;
  quantityFtd: number;
  totalFtd: number;
  quantityCftd: number;
  totalCftd: number;
  totalConversion: number;
  quantityAffiliateFtd: number;
  totalAffiliateFtd: number;
  totalAffiliateConversion: number;
  owner: UserEntity;
  department: CategoryEntity;
  currentCrm: CrmEntity;
  status: StatusEntity;
  crmList: CrmEntity[];
  pspList: PspEntity[];
  createdAt: Date;
  updatedAt: Date;
}
