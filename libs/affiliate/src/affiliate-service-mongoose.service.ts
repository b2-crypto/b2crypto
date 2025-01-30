import { AffiliateCreateDto } from '@affiliate/affiliate/domain/dto/affiliate.create.dto';
import { AffiliateUpdateDto } from '@affiliate/affiliate/domain/dto/affiliate.update.dto';
import {
  Affiliate,
  AffiliateDocument,
} from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import dbIntegrationEnum from '@builder/builders/enums/db-integration.enum';
import { CommonService } from '@common/common';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { CrmServiceMongooseService } from '@crm/crm';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { IpAddressServiceMongooseService } from '@ip-address/ip-address';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { PersonServiceMongooseService } from '@person/person';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import { PersonDocument } from '@person/person/entities/mongoose/person.schema';
import { TrafficServiceMongooseService } from '@traffic/traffic';
import { TrafficCreateDto } from '@traffic/traffic/dto/traffic.create.dto';
import { TrafficDocument } from '@traffic/traffic/entities/mongoose/traffic.schema';
import { UserServiceMongooseService } from '@user/user';
import { BrandServiceMongooseService } from 'libs/brand/src';
import { Model } from 'mongoose';
import { IpAddressDocument } from '../../ip-address/src/entities/mongoose/ip-address.schema';
import { UserDocument } from '../../user/src/entities/mongoose/user.schema';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class AffiliateServiceMongooseService extends BasicServiceModel<
  AffiliateDocument,
  Model<AffiliateDocument>,
  AffiliateCreateDto,
  AffiliateUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('AFFILIATE_MODEL_MONGOOSE')
    affiliateModel: Model<AffiliateDocument>,
    @Inject(UserServiceMongooseService)
    private userService: UserServiceMongooseService,
    @Inject(PersonServiceMongooseService)
    private personService: PersonServiceMongooseService,
    @Inject(IpAddressServiceMongooseService)
    private ipAddressService: IpAddressServiceMongooseService,
    @Inject(BrandServiceMongooseService)
    private brandService: BrandServiceMongooseService,
    @Inject(CrmServiceMongooseService)
    private crmService: CrmServiceMongooseService,
    @Inject(TrafficServiceMongooseService)
    private trafficService: TrafficServiceMongooseService,
  ) {
    super(logger, affiliateModel);
  }

  async findAll(query) {
    if (!query?.relations || query?.relations.indexOf('brand') < 0) {
      query.relations = query.relations || [];
      query.relations.push('brand');
    }
    const list = await super.findAll(query);

    // TODO[hender - 2024/02/24] Remove when added integration group
    list.list = list.list.map((aff) => {
      if (aff.brand?.name && aff.name.indexOf(aff.brand.name) < 0) {
        aff.name = aff.name + ' - ' + aff.brand.name;
      }
      if (aff.name.indexOf('internal') < 0) {
        aff.name = aff.name + ' ANG';
      }
      return aff;
    });
    return list;
  }

  async create(createAnyDto: AffiliateCreateDto): Promise<AffiliateDocument> {
    const rta = await this.createMany([createAnyDto]);
    return rta[0];
  }

  async createMany(
    createAnyDto: AffiliateCreateDto[],
  ): Promise<AffiliateDocument[]> {
    if (this.nameOrm === dbIntegrationEnum.MONGOOSE) {
      const promises = [];
      for (const dto of createAnyDto) {
        const email = dto.personalData?.email || dto.user?.email;
        const affiliate: Affiliate = { ...dto } as unknown as Affiliate;
        // Check Person
        const persons: ResponsePaginator<PersonDocument> =
          await this.personService.findAll({
            where: {
              email: {
                $in: [email],
              },
            },
          });
        let person: PersonDocument = persons.list[0];
        let user: UserDocument;
        if (person?.id) {
          // Person finded. Update name and email of Person
          person.name = person.name || dto.user.name;
          person.email = person.email || [];
          const existEmail = !!person.email.find(
            (elem) => elem === dto.user.email,
          );
          if (!existEmail) {
            person.email.push(dto.user.email);
          }
          // TODO[hender] Add the telephone to person.telephone
          await person.save();
          if (person.user) {
            user = await this.userService.findOne(person.user.toString());
          }
          person.user = user;
        } else {
          // No Person finded. Create Person
          dto.personalData = dto.personalData || ({} as PersonCreateDto);
          dto.personalData.firstName = dto.user.name;
          dto.personalData.email = dto.user.email;
          person = await this.personService.create(dto.personalData);
          // Create User
          dto.user.slugEmail = CommonService.getSlug(dto.user.email);
          dto.user.username =
            dto.user.username ?? CommonService.getSlug(dto.user.name);
          dto.user.slugUsername = CommonService.getSlug(dto.user.username);
          user = await this.userService.create(dto.user);
          user.personalData = person.id || person;
          person.user = user;
          await person.save();
          await user.save();
        }
        if (!person?.user) {
          // Every user have personalData && All person have unique user
          throw new BadRequestException('The person have not user asociated');
        }
        affiliate.personalData = person;
        affiliate.user = person.user;
        affiliate.email = user.email;
        affiliate.name = user.name;
        affiliate.description = user.description;
        affiliate.docId = person.numDocId;

        // Create IP Address
        affiliate.ipAllowed = affiliate.ipAllowed || [];
        if (affiliate.ipAllowed.length < 0) {
          throw new BadRequestException('The affilite have not ip allowed');
        }
        for (const ipAddressIdx in dto.ipAllowed) {
          const ipAddressStr = dto.ipAllowed[ipAddressIdx];
          const ipAddresses: ResponsePaginator<IpAddressDocument> =
            await this.ipAddressService.findAll({
              where: {
                ip: ipAddressStr,
              },
            });
          let ipAddress: IpAddressDocument = ipAddresses.list[0];
          if (!ipAddress?.id) {
            // Create
            ipAddress = await this.ipAddressService.create({
              user: affiliate.user,
              name: 'Ip of ' + affiliate.name,
              description: 'Ip allowed for ' + affiliate.name,
              ip: ipAddressStr,
              active: true,
            });
          }
          // Added ip address to list
          affiliate.ipAllowed[parseInt(ipAddressIdx)] = ipAddress;
        }
        // Check the Brand
        const brands: ResponsePaginator<BrandDocument> =
          await this.brandService.findAll({
            where: {
              _id: dto.brand,
            },
          });
        const brand: BrandDocument = brands.list[0];
        if (!brand?.id) {
          throw new BadRequestException('The Brand no exist');
        }
        affiliate.brand = brand;

        // Check CRM
        let crm: CrmDocument;
        if (dto.crm) {
          crm = await this.crmService.findOne(dto.crm);
        } else {
          // Check the CRM
          const crms: ResponsePaginator<CrmDocument> =
            await this.crmService.findAll({
              where: {
                brand: dto.brand,
              },
            });
          crm = crms.list[0];
        }
        if (!crm?.id) {
          throw new BadRequestException('The CRM no exist');
        }
        affiliate.crm = crm;

        affiliate.buOwnerId = crm.buOwnerIdCrm;
        affiliate.organization = crm.organizationCrm;
        affiliate.crmUsernameAffiliate = crm.userCrm;
        affiliate.crmPasswordAffiliate = crm.passwordCrm;
        affiliate.tradingPlatformId = crm.tradingPlatformIdCrm;

        affiliate.publicKey = CommonService.getHash(
          brand.id + '_' + crm.id + '_' + person.id + '_' + affiliate.id,
          8,
        );

        // Create Traffic
        const trafficDto = {
          name: 'First traffic of ' + affiliate.name,
          startDate: new Date(),
          //endDate: new Date(),
          person: affiliate.personalData.id,
          affiliate: affiliate.id,
          crm: affiliate.crm.id,
        } as unknown as TrafficCreateDto;
        const traffic: TrafficDocument = await this.trafficService.create(
          trafficDto,
        );
        affiliate.traffics = affiliate.traffics || [];
        affiliate.traffics.push(traffic.id);
        affiliate.currentTraffic = traffic._id;

        const affiliateSaved: AffiliateDocument = await this.model.create(
          affiliate,
        );
        //brand.affiliates.push(affiliateSaved);
        //user.apiKey = affiliateSaved.publicKey;
        person.affiliates = person.affiliates || [];
        person.affiliates.push(affiliateSaved.id);
        //user.affiliates.push(affiliateSaved);
        //crm.affiliates.push(affiliateSaved.id);
        await brand.save();
        await person.save();
        //await user.save();
        await crm.save();

        // Create Affiliate
        promises.push(affiliateSaved);
        // Send affiliate to CRM
        // TODO[hender] Create affiliate in CRM
      }
      return promises;
    }
    return this.model.save(createAnyDto);
  }
}
