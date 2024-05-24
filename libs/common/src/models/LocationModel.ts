import { CategoryInterface } from '@category/category/entities/category.interface';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import AddressModel from './AddressModel';
import CityModel from './CityModel';
import ColonyModel from './ColonyModel';
import GeopointModel from './GeopointModel';
import StreetModel from './StreetModel';
import ZipCodeModel from './ZipCodeModel';

interface LocationModel {
  name: string;
  description: string;
  category: CategoryInterface;
  colony: ColonyModel;
  city: string;
  country: CountryCodeEnum;
  address: AddressModel;
  street: StreetModel;
  zipcode: string;
  // The geoposition of location
  geopoint: GeopointModel;
}

export default LocationModel;
