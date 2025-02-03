import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BrandCreateDto } from '@brand/brand/dto/brand.create.dto';
import { BrandUpdateDto } from '@brand/brand/dto/brand.update.dto';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import TagEnum from '@common/common/enums/TagEnum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigCheckStatsDto } from '@stats/stats/dto/config.check.stats.dto';
import CheckStatsType from '@stats/stats/enum/check.stats.type';
import { Status } from '@status/status/entities/mongoose/status.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import axios from 'axios';
import { BrandServiceMongooseService } from 'libs/brand/src';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { BadRequestError } from 'passport-headerapikey';

@Traceable()
@Injectable()
export class BrandServiceService {
  constructor(
    @InjectPinoLogger(BrandServiceService.name)
    protected readonly logger: PinoLogger,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
    @Inject(BrandServiceMongooseService)
    private lib: BrandServiceMongooseService,
  ) {}

  async count(query: QuerySearchAnyDto) {
    return this.lib.count(query);
  }

  async getOne(id: string) {
    return this.lib.findOne(id);
  }

  async getAll(query: QuerySearchAnyDto) {
    query = query || {};
    query.where = query.where || {};
    if (!query.where.status) {
      const activeStatus =
        await this.builder.getPromiseStatusEventClient<Status>(
          EventsNamesStatusEnum.findOneByName,
          'active',
        );
      if (!activeStatus) {
        throw new BadRequestError('Status active not found');
      }
      query.where.status = activeStatus._id;
    }
    return this.lib.findAll(query);
  }

  async getAllRetention(query: QuerySearchAnyDto) {
    return this.getAllByDepartment(query, 'Retention');
  }

  async getAllSales(query: QuerySearchAnyDto) {
    return this.getAllByDepartment(query, 'Sales');
  }

  async getAllByDepartment(query: QuerySearchAnyDto, departmentName: string) {
    query = query ?? {};
    query.where = query.where ?? {};
    const retentionCat = await this.builder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      {
        name: departmentName,
        type: TagEnum.DEPARTMENT,
      },
    );
    if (!retentionCat) {
      throw new BadRequestError('Department retention not found');
    }
    query.where.department = retentionCat._id;
    return this.getAll(query);
  }

  async newBrand(brand: BrandCreateDto) {
    return this.lib.create(brand);
  }

  async newManyBrand(createBrandsDto: BrandCreateDto[]) {
    return this.lib.createMany(createBrandsDto);
  }

  async updateBrand(brand: BrandUpdateDto) {
    return this.lib.update(brand.id.toString(), brand);
  }

  async updateManyBrands(brands: BrandUpdateDto[]) {
    return this.lib.updateMany(
      brands.map((brand) => brand.id.toString()),
      brands,
    );
  }

  async deleteBrand(id: string) {
    return this.lib.remove(id);
  }

  async deleteManyBrands(ids: string[]) {
    return this.lib.removeMany(ids);
  }

  async download() {
    // TODO[hender] Not implemented download
    return Promise.resolve(undefined);
  }

  async checkStats(configCheckStats: ConfigCheckStatsDto) {
    switch (configCheckStats.checkType) {
      case CheckStatsType.ALL:
        this.checkStatsLead(configCheckStats);
        this.checkStatsTransfer(configCheckStats);
        break;
      case CheckStatsType.LEAD:
        this.checkStatsLead(configCheckStats);
        break;
      case CheckStatsType.PSP_ACCOUNT:
        this.checkStatsTransfer(configCheckStats);
        break;
    }
  }

  async checkStatsLead(configCheckStats: ConfigCheckStatsDto, page = 1) {
    const brands: ResponsePaginator<BrandDocument> = await this.lib.findAll({
      page,
    });
    for (const brand of brands.list) {
      this.builder.emitLeadEventClient(
        EventsNamesLeadEnum.checkLeadsForBrandStats,
        brand.id,
      );
    }
    if (brands.currentPage !== brands.lastPage) {
      this.checkStatsLead(configCheckStats, brands.nextPage);
    }
  }

  async checkStatsTransfer(configCheckStats: ConfigCheckStatsDto) {
    this.logger.debug('CHECK STATS BRANDS TRANSFER');
  }

  async checkCashierBrands() {
    try {
      //TODO[hender] Add url to get brands from cashier
      const url = '';
      const brandResponse = await axios.get(url);
      const brandList = brandResponse.data.payload;
      for (const brand of brandList) {
        const slug = CommonService.getSlug(brand.name);
        const item = (
          await this.lib.findAll({
            where: {
              slug: slug,
            },
          })
        ).list[0];
        if (item?.id) {
          await this.lib.update(item.id, {
            id: item.id,
            name: brand.name,
            idCashier: brand.id,
            slug: slug,
            description: 'Brand active in cashier',
          });
        } else {
          await this.lib.create({
            name: brand.name,
            idCashier: brand.id,
            slug: slug,
            description: 'Brand active in cashier',
          });
        }
      }
    } catch (err) {
      throw err;
    }
  }
}
