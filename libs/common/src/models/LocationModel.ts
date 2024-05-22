import { CategoryInterface } from '@category/category/entities/category.interface';
import CountryCodeB2cryptoEnum from '@common/common/enums/country.code.b2crypto.enum';
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
  city: CityModel;
  country: CountryCodeB2cryptoEnum;
  address: AddressModel;
  street: StreetModel;
  zipcode: ZipCodeModel;
  // The geoposition of location
  geopoint: GeopointModel;
}

export default LocationModel;
