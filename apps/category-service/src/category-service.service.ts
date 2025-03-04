import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CategoryServiceMongooseService } from '@category/category';
import { CategoryCreateDto } from '@category/category/dto/category.create.dto';
import { CategoryUpdateDto } from '@category/category/dto/category.update.dto';
import ActionsEnum from '@common/common/enums/ActionEnum';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PspAccountInterface } from '@psp-account/psp-account/entities/psp-account.interface';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import EventsNamesPermissionEnum from 'apps/permission-service/src/enum/events.names.permission.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import { CategoryResponseDto } from './dto/category.response.dto';
import { PspAccountResponseDto } from './dto/psp.account.response.dto';
import csc from 'countries-states-cities';

@Traceable()
@Injectable()
export class CategoryServiceService {
  constructor(
    @Inject(BuildersService)
    private builder: BuildersService,
    @Inject(CategoryServiceMongooseService)
    private lib: CategoryServiceMongooseService,
  ) {}

  async getOne(id: string) {
    return this.lib.findOne(id);
  }

  async categoryListByType(
    type: string,
    query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<CategoryResponseDto> | string[]> {
    if (type.toLowerCase() == 'doc_type') {
      return Promise.resolve(Object.values(DocIdTypeEnum));
    } else if (type.toLowerCase() == 'resources') {
      return Promise.resolve(Object.values(ResourcesEnum));
    } else if (type.toLowerCase() == 'actions') {
      return Promise.resolve(Object.values(ActionsEnum));
    } else if (type.toLowerCase() == 'monetary_operation_type') {
      return Promise.resolve(Object.values(OperationTransactionType));
    } else if (type.toLowerCase() == 'scopes') {
      return this.builder.getPromisePermissionEventClient(
        EventsNamesPermissionEnum.findAllScope,
        query,
      );
    }
    if (type in TagEnum) {
      query.where = query.where || {};
      query.where.type = type;
      const paginator = new ResponsePaginator<CategoryResponseDto>();
      const rta = await this.lib.findAll(query);
      paginator.elementsPerPage = rta.elementsPerPage;
      paginator.totalElements = rta.totalElements;
      paginator.currentPage = rta.currentPage;
      paginator.firstPage = rta.firstPage;
      paginator.lastPage = rta.lastPage;
      paginator.nextPage = rta.nextPage;
      paginator.prevPage = rta.prevPage;
      paginator.order = rta.order;
      paginator.list = rta.list.map((item) => {
        return new CategoryResponseDto(item);
      });
      return Promise.resolve(paginator);
    }
    throw new BadRequestException("The category type isn't exist");
  }

  /* async countryList() {
    return Object.keys(CountryCodeEnum);
  }

  async currencyList() {
    return Object.keys(CurrencyCodeB2cryptoEnum);
  } */

  async getAll(query: QuerySearchAnyDto) {
    return this.lib.findAll(query);
  }

  async newCategory(category: CategoryCreateDto) {
    return this.lib.create(category);
  }

  async newManyCategory(createCategoriesDto: CategoryCreateDto[]) {
    return this.lib.createMany(createCategoriesDto);
  }

  async updateCategory(category: CategoryUpdateDto) {
    return this.lib.update(category.id.toString(), category);
  }

  async updateManyCategories(categories: CategoryUpdateDto[]) {
    return this.lib.updateMany(
      categories.map((category) => category.id.toString()),
      categories,
    );
  }

  async deleteCategory(id: string) {
    return this.lib.remove(id);
  }

  async deleteManyCategories(ids: string[]) {
    return this.lib.removeMany(ids);
  }

  async download() {
    // TODO[hender] Not implemented download
    return Promise.resolve(undefined);
  }

  async getPspAccount(
    query: QuerySearchAnyDto,
  ): Promise<ResponsePaginator<PspAccountResponseDto>> {
    const paginator = await this.builder.getPromisePspAccountEventClient(
      EventsNamesPspAccountEnum.findAll,
      query,
    );
    return this.getPspAccountPaginator(paginator);
  }

  getPspAccountPaginator(
    paginator: ResponsePaginator<PspAccountInterface>,
  ): ResponsePaginator<PspAccountResponseDto> {
    const page = new ResponsePaginator<PspAccountResponseDto>();
    page.currentPage = paginator.currentPage;
    page.elementsPerPage = paginator.elementsPerPage;
    page.firstPage = paginator.firstPage;
    page.lastPage = paginator.lastPage;
    page.nextPage = paginator.nextPage;
    page.order = paginator.order;
    page.prevPage = paginator.prevPage;
    page.totalElements = paginator.totalElements;
    page.list = paginator.list.map((pa) => new PspAccountResponseDto(pa));
    return page;
  }
  async getGeographicDataFromLibrary(type: string, parentId?: string): Promise<any[]> {
    if (type === 'COUNTRY') {
      const countries = csc.getAllCountries();
      
      return countries.map(country => ({
        id: country.id,
        name: country.name,
        iso2: country.iso2,
        iso3: country.iso3,
        phone_code: country.phone_code,
        currency: country.currency,
        region: country.region,
        flagUrl: `https://flagcdn.com/w320/${country.iso2.toLowerCase()}.png`
      }));
    } 
    else if (type === 'DEPARTMENT') {
      if (!parentId) {
        return [];
      }
      
      const countryId = parseInt(parentId, 10);
      const states = csc.getStatesOfCountry(countryId);
      
      return states.map(state => ({
        id: state.id,
        name: state.name,
        state_code: state.state_code,
        country_id: state.country_id,
        country_code: state.country_code,
      }));
    } 
    else if (type === 'CITY') {
      if (!parentId) {
        return [];
      }
      
      const stateId = parseInt(parentId, 10);
      const cities = csc.getCitiesOfState(stateId);
      
      return cities.map(city => ({
        id: city.id,
        name: city.name,
        state_id: city.state_id,
        state_code: city.state_code,
        country_code: city.country_code,
      }));
    }
    
    return [];
  }
  
}
