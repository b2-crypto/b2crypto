import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';

interface AddressModel {
  street_name: string;
  street_number: string;
  floor: string;
  zip_code: string;
  apartment: string;
  neighborhood: string;
  city: string;
  region: string;
  additional_info: string;
  country: CountryCodeEnum;
}

export default AddressModel;
