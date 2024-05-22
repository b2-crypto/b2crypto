import { BrandEntity } from 'libs/brand/src/entities/brand.entity';
import { CategoryEntity } from '@category/category/entities/category.entity';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CrmEntity } from '@crm/crm/entities/crm.entity';
import { PersonEntity } from '@person/person/entities/person.entity';
import { TrafficInterface } from './traffic.interface';
import { ObjectId } from 'mongoose';
import { AffiliateEntity } from '@affiliate/affiliate/domain/entities/affiliate.entity';

export class TrafficEntity implements TrafficInterface {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  startDate: Date;
  endDate: Date;
  nextTraffic: TrafficEntity;
  prevTraffic: TrafficEntity;
  person: PersonEntity;
  affiliate: AffiliateEntity;
  crm: CrmEntity;
  brand: BrandEntity;
  blackListSources: string[];
  blackListSourcesType: CategoryEntity[];
  blackListCountries: CountryCodeB2cryptoEnum[];
  createdAt: Date;
  updatedAt: Date;
}
