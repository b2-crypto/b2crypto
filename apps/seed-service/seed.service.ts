import { ActivityServiceMongooseService } from '@activity/activity';
import { AffiliateServiceMongooseService } from '@affiliate/affiliate';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CategoryServiceMongooseService } from '@category/category';
import { CrmServiceMongooseService } from '@crm/crm';
import { LeadServiceMongooseService } from '@lead/lead';
import { Inject, Injectable } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PermissionServiceMongooseService } from '@permission/permission';
import { PersonServiceMongooseService } from '@person/person';
import { PspAccountServiceMongooseService } from '@psp-account/psp-account';
import { PspServiceMongooseService } from '@psp/psp';
import { RoleServiceMongooseService } from '@role/role';
import {
  StatsDateAffiliateServiceMongooseService,
  StatsDatePspAccountServiceMongooseService,
} from '@stats/stats';
import { StatusServiceMongooseService } from '@status/status';
import { TrafficServiceMongooseService } from '@traffic/traffic';
import { TransferServiceMongooseService } from '@transfer/transfer';
import { UserServiceMongooseService } from '@user/user';
import { BrandServiceMongooseService } from 'libs/brand/src';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import creator from './data/initial-data';

@Traceable()
@Injectable()
export class SeedService {
  private eventClient: ClientProxy;
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
    private readonly transferRepo: TransferServiceMongooseService,
    private readonly activityRepo: ActivityServiceMongooseService,
    private readonly roleRepo: RoleServiceMongooseService,
    private readonly permissionRepo: PermissionServiceMongooseService,
    private readonly brandRepo: BrandServiceMongooseService,
    private readonly crmRepo: CrmServiceMongooseService,
    private readonly pspRepo: PspServiceMongooseService,
    private readonly pspAccountRepo: PspAccountServiceMongooseService,
    private readonly categoryRepo: CategoryServiceMongooseService,
    private readonly userRepo: UserServiceMongooseService,
    private readonly statusRepo: StatusServiceMongooseService,
    private readonly affiliateRepo: AffiliateServiceMongooseService,
    private readonly trafficRepo: TrafficServiceMongooseService,
    private readonly personRepo: PersonServiceMongooseService,
    private readonly leadRepo: LeadServiceMongooseService,
    private readonly statsDateAffiliatesRepo: StatsDateAffiliateServiceMongooseService,
    private readonly statsDatePspAccountsRepo: StatsDatePspAccountServiceMongooseService,
  ) {
    creator.setBuilder(this.builder);
  }

  async saveInitialData() {
    const countCrm = await this.crmRepo.count();
    const countPsp = await this.pspRepo.count();
    const countUsers = await this.userRepo.count();
    const countRoles = await this.roleRepo.count();
    const countLeads = await this.leadRepo.count();
    const countBrand = await this.brandRepo.count();
    const countTraffic = await this.trafficRepo.count();
    //const countTransfers = await this.transferRepo.count();
    const countStatuses = await this.statusRepo.count();
    const countCategories = await this.categoryRepo.count();
    const countAffiliates = await this.affiliateRepo.count();
    const countPspAccount = await this.pspAccountRepo.count();
    const countPermissions = await this.permissionRepo.count();

    if (
      !countCrm ||
      !countPsp ||
      !countUsers ||
      !countRoles ||
      !countLeads ||
      !countBrand ||
      !countTraffic ||
      !countStatuses ||
      !countPspAccount ||
      !countCategories ||
      !countAffiliates ||
      !countPermissions /*||
      !countTransfers*/
    ) {
      this.logger.debug('Seeding initial data...', SeedService.name);
      // await this.clearStats();
      // await this.clearActivities();
      // await this.clearPersons();
      // await this.seedStatus();
      // await this.seedCategory();
      // await this.seedPermissions();
      // await this.seedRoles();
      // await this.seedBrands();
      // await this.seedCrm();
      // await this.seedUsers();
      // await this.seedPsps();
      // await this.seedPspAccounts();
      // await this.seedAffiliates();
      // await this.seedLeads();
      //await this.seedTransfers();
    }
    return {
      statusCode: 200,
      msg: 'Seeds loaded',
    };
  }

  async clearStats() {
    this.logger.debug('Clear stats...', SeedService.name);
    return Promise.all([
      this.statsDatePspAccountsRepo.clear(),
      this.statsDateAffiliatesRepo.clear(),
    ]);
  }
  async clearActivities() {
    this.logger.debug('Clear activities...', SeedService.name);
    return this.activityRepo.clear();
  }
  async clearStatus() {
    this.logger.debug('Clear status...', SeedService.name);
    return this.statusRepo.clear();
  }
  async clearCategories() {
    this.logger.debug('Start seed categories...', SeedService.name);
    return this.categoryRepo.clear();
  }
  async clearPermissions() {
    // Clear Permissions
    this.logger.debug('Clear permissions...', SeedService.name);
    return this.permissionRepo.clear();
  }
  async clearRoles() {
    // Clear Roles
    this.logger.debug('Clear roles...', SeedService.name);
    return this.roleRepo.clear();
  }
  async clearBrands() {
    // Clear Brands
    this.logger.debug('Clear brands...', SeedService.name);
    return this.brandRepo.clear();
  }
  async clearCrms() {
    // Clear Crms
    this.logger.debug('Clear crms...', SeedService.name);
    return this.crmRepo.clear();
  }
  async clearPersons() {
    // Clear Persons
    this.logger.debug('Clear persons...', SeedService.name);
    return this.personRepo.clear();
  }
  async clearUsers() {
    // Clear Users
    this.logger.debug('Clear users...', SeedService.name);
    return this.userRepo.clear();
  }
  async clearPsps() {
    // Clear Psps
    this.logger.debug('Clear psps...', SeedService.name);
    return this.pspRepo.clear();
  }
  async clearPspAccounts() {
    // Clear Psps Account
    this.logger.debug('Clear psps account...', SeedService.name);
    return this.pspAccountRepo.clear();
  }
  async clearTraffic() {
    // Clear Traffic
    this.logger.debug('Clear traffic...', SeedService.name);
    return this.trafficRepo.clear();
  }
  async clearAffiliates() {
    // Clear Affiliates
    this.logger.debug('Clear affiliate...', SeedService.name);
    return this.affiliateRepo.clear();
  }
  async clearLeads() {
    // Clear Leads
    this.logger.debug('Clear lead...', SeedService.name);
    return this.leadRepo.clear();
  }
  async clearTransfers() {
    // Clear Transfers
    this.logger.debug('Clear transfers...', SeedService.name);
    return this.transferRepo.clear();
  }

  async seedStatus() {
    this.clearStatus();
    // Create Status
    this.logger.debug('Saving status...', SeedService.name);
    return creator.createInitialStatusDataList();
  }

  async seedCategory() {
    this.clearCategories();
    this.logger.debug('Saving categories...', SeedService.name);
    return Promise.all([
      // Create Category/Categories
      await creator.createInitialCategoryDataList(),
      // Create Category/Departments
      await creator.createInitialCategoryDepartmentDataList(),
      // Create Category/SourcesType
      await creator.createInitialCategoryReferralTypeDataList(),
      // Create Category/MonetaryTransactionType
      await creator.createInitialCategoryMonetaryTransactionDataList(),
      // Create Category/Crm (Antelope and Leverate)
      await creator.createInitialCategoryCrmDataList(),
      // Create Category/Rules
      await creator.createInitialCategoryRuleDataList(),
      // Create Category/Countries
      await creator.createInitialCategoryCountryDataList(),
      // Create Category/Currency
      await creator.createInitialCategoryCurrencyDataList(),
      // Create Category/Bank
      await creator.createInitialCategoryBankDataList(),
    ]);
  }

  async seedPermissions() {
    this.clearPermissions();
    // Create Permissions
    this.logger.debug('Saving permissions...', SeedService.name);
    return creator.createInitialPermissionDataList();
  }

  async seedRoles() {
    this.clearRoles();
    // Create Roles
    this.logger.debug('Saving roles...', SeedService.name);
    return creator.createInitialRoleDataList();
  }

  async seedBrands() {
    this.clearBrands();
    // Create Brands
    this.logger.debug('Saving brands...', SeedService.name);
    return creator.createInitialBrandDataList();
  }
  async seedCrm() {
    await this.clearCrms();
    // Create Crms
    this.logger.debug('Saving crms...', SeedService.name);
    return creator.createInitialCrmDataList();
  }
  async seedUsers() {
    await this.clearUsers();
    // Create Users
    this.logger.debug('Saving superadmin...', SeedService.name);
    return creator.createInitialUserDataList();
  }
  async seedPsps() {
    await this.clearPsps();
    // Create Psps
    this.logger.debug('Saving psp...', SeedService.name);
    return creator.createInitialPspDataList();
  }
  async seedPspAccounts() {
    await this.clearPspAccounts();
    // Create Psps
    this.logger.debug('Saving psp account...', SeedService.name);
    return creator.createInitialPspAccountDataList();
  }
  async seedAffiliates() {
    await Promise.all([this.clearTraffic(), this.clearAffiliates()]);
    // Create Affiliate
    this.logger.debug('Saving affiliate...', SeedService.name);
    return creator.createInitialAffiliateDataList();
  }
  async seedLeads() {
    await this.clearLeads();
    // Create Lead
    this.logger.debug('Save lead...', SeedService.name);
    return creator.createInitialLeadDataList();
  }
  async seedTransfers() {
    await this.clearTransfers();
    this.logger.debug('Save transfers...', SeedService.name);
    return creator.createInitialTransferDataList();
  }
}
