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
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import creator from './data/initial-data';

@Traceable()
@Injectable()
export class SeedService {
  private eventClient: ClientProxy;
  constructor(
    @InjectPinoLogger(SeedService.name)
    protected readonly logger: PinoLogger,
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
      this.logger.debug(`[saveInitialData] Clearing stats...`);
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
    this.logger.debug(`[clearStats] Clear stats...`);
    return Promise.all([
      this.statsDatePspAccountsRepo.clear(),
      this.statsDateAffiliatesRepo.clear(),
    ]);
  }
  async clearActivities() {
    this.logger.debug(`[clearActivities] Clear activities...`);
    return this.activityRepo.clear();
  }
  async clearStatus() {
    this.logger.debug(`[clearStatus] Clear status...`);
    return this.statusRepo.clear();
  }
  async clearCategories() {
    this.logger.debug(`[clearCategories] Start seed categories...`);
    return this.categoryRepo.clear();
  }
  async clearPermissions() {
    // Clear Permissions
    this.logger.debug('Clear permissions...', SeedService.name);
    return this.permissionRepo.clear();
  }
  async clearRoles() {
    // Clear Roles
    this.logger.debug(`[clearRoles] Clear roles...`);
    return this.roleRepo.clear();
  }
  async clearBrands() {
    // Clear Brands
    this.logger.debug(`[clearBrands] Clear brands...`);
    return this.brandRepo.clear();
  }
  async clearCrms() {
    // Clear Crms
    this.logger.debug(`[clearCrms] Clear crms...`);
    return this.crmRepo.clear();
  }
  async clearPersons() {
    // Clear Persons
    this.logger.debug(`[clearPersons] Clear persons...`);
    return this.personRepo.clear();
  }
  async clearUsers() {
    // Clear Users
    this.logger.debug(`[clearUsers] Clear users...`);
    return this.userRepo.clear();
  }
  async clearPsps() {
    // Clear Psps
    this.logger.debug(`[clearPsps] Clear psps...`);
    return this.pspRepo.clear();
  }
  async clearPspAccounts() {
    // Clear Psps Account
    this.logger.debug(`[clearPspAccounts] Clear psps account...`);
    return this.pspAccountRepo.clear();
  }
  async clearTraffic() {
    // Clear Traffic
    this.logger.debug(`[clearTraffic] Clear traffic...`);
    return this.trafficRepo.clear();
  }
  async clearAffiliates() {
    // Clear Affiliates
    this.logger.debug(`[clearAffiliates] Clear affiliate...`);
    return this.affiliateRepo.clear();
  }
  async clearLeads() {
    // Clear Leads
    this.logger.debug(`[clearLeads] Clear lead...`);
    return this.leadRepo.clear();
  }
  async clearTransfers() {
    // Clear Transfers
    this.logger.debug(`[clearTransfers] Clear transfers...`);
    return this.transferRepo.clear();
  }

  async seedStatus() {
    this.clearStatus();
    // Create Status
    this.logger.debug(`[seedStatus] Saving status...`);
    return creator.createInitialStatusDataList();
  }

  async seedCategory() {
    this.clearCategories();
    this.logger.debug(`[seedCategory] Saving categories...`);
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
    this.logger.debug(`[seedPermissions] Saving permissions...`);
    return creator.createInitialPermissionDataList();
  }

  async seedRoles() {
    this.clearRoles();
    // Create Roles
    this.logger.debug(`[seedRoles] Saving roles...`);
    return creator.createInitialRoleDataList();
  }

  async seedBrands() {
    this.clearBrands();
    // Create Brands
    this.logger.debug(`[seedBrands] Saving brands...`);
    return creator.createInitialBrandDataList();
  }
  async seedCrm() {
    await this.clearCrms();
    // Create Crms
    this.logger.debug(`[seedCrm] Saving crms...`);
    return creator.createInitialCrmDataList();
  }
  async seedUsers() {
    await this.clearUsers();
    // Create Users
    this.logger.debug(`[seedUsers] Saving superadmin...`);
    return creator.createInitialUserDataList();
  }
  async seedPsps() {
    await this.clearPsps();
    // Create Psps
    this.logger.debug(`[]seedPsps] Saving psp...`);
    return creator.createInitialPspDataList();
  }
  async seedPspAccounts() {
    await this.clearPspAccounts();
    // Create Psps
    this.logger.debug(`[seedPspAccounts] Saving psp account...`);
    return creator.createInitialPspAccountDataList();
  }
  async seedAffiliates() {
    await Promise.all([this.clearTraffic(), this.clearAffiliates()]);
    // Create Affiliate
    this.logger.debug(`[seedAffiliates] Saving affiliate...`);
    return creator.createInitialAffiliateDataList();
  }
  async seedLeads() {
    await this.clearLeads();
    // Create Lead
    this.logger.debug(`[seedLeads] Save lead...`);
    return creator.createInitialLeadDataList();
  }
  async seedTransfers() {
    await this.clearTransfers();
    this.logger.debug(`[seedTransfers] Save transfers...`);
    return creator.createInitialTransferDataList();
  }
}
