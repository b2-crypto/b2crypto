import { AffiliateInterface } from '@affiliate/affiliate/domain/entities/affiliate.interface';
import { BrandInterface } from 'libs/brand/src/entities/brand.interface';
import { CategoryInterface } from '@category/category/entities/category.interface';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
import { CrmInterface } from '@crm/crm/entities/crm.interface';
import { PersonInterface } from '@person/person/entities/PersonInterface';
import { ObjectId } from 'mongoose';
export interface TrafficInterface {
  _id?: ObjectId;
  id: string;
  name: string;
  slug: string;
  description: string;
  searchText: string;
  startDate: Date;
  endDate: Date;
  nextTraffic: TrafficInterface;
  prevTraffic: TrafficInterface;
  person: PersonInterface;
  affiliate: AffiliateInterface;
  crm: CrmInterface;
  brand: BrandInterface;
  blackListSources: string[];
  blackListSourcesType: CategoryInterface[];
  blackListCountries: CountryCodeB2cryptoEnum[];
  createdAt: Date;
  updatedAt: Date;
}

export const TrafficPropertiesRelations = [
  'nextTraffic',
  'prevTraffic',
  'person',
  'affiliate',
  'crm',
  'brand',
  'blackListSourcesType',
];

export const TrafficPropertiesBasic = [
  '_id',
  'id',
  'name',
  'slug',
  'description',
  'searchText',
  'startDate',
  'endDate',
  'blackListSources',
  'blackListSourcesType',
  'blackListCountries',
  'createdAt',
  'updatedAt',
];
