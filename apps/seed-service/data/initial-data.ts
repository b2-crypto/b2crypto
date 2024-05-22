import { AffiliateCreateDto } from '@affiliate/affiliate/domain/dto/affiliate.create.dto';
import { CreateLeadAffiliateDto } from '@affiliate/affiliate/domain/dto/create-lead-affiliate.dto';
import { AffiliateDocument } from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { BuildersService } from '@builder/builders';
import { BrandCreateDto } from '@brand/brand/dto/brand.create.dto';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { CategoryCreateDto } from '@category/category/dto/category.create.dto';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { CommonService } from '@common/common/common.service';
import ActionsEnum from '@common/common/enums/ActionEnum';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { CrmCreateDto } from '@crm/crm/dto/crm.create.dto';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import { LeadCreateDto } from '@lead/lead/dto/lead.create.dto';
import { LeadDocument } from '@lead/lead/entities/mongoose/lead.schema';
import { BadRequestException } from '@nestjs/common';
import { PermissionCreateDto } from '@permission/permission/dto/permission.create.dto';
import { ScopeDto } from '@permission/permission/dto/scope.dto';
import { TimeLiveDto } from '@permission/permission/dto/time.live.dto';
import { PermissionDocument } from '@permission/permission/entities/mongoose/permission.schema';
import LocationDto from '@person/person/dto/location.dto';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import TelephoneDto from '@person/person/dto/telephone.dto';
import { PspAccountCreateDto } from '@psp-account/psp-account/dto/psp-account.create.dto';
import { PspAccountDocument } from '@psp-account/psp-account/entities/mongoose/psp-account.schema';
import { PspCreateDto } from '@psp/psp/dto/psp.create.dto';
import { PspDocument } from '@psp/psp/entities/mongoose/psp.schema';
import { RoleCreateDto } from '@role/role/dto/role.create.dto';
import { RoleDocument } from '@role/role/entities/mongoose/role.schema';
import { StatusCreateDto } from '@status/status/dto/status.create.dto';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { TransferDocument } from '@transfer/transfer/entities/mongoose/transfer.schema';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserDocument } from '@user/user/entities/mongoose/user.schema';
import EventsNamesAffiliateEnum from 'apps/affiliate-service/src/enum/events.names.affiliate.enum';
import EventsNamesBrandEnum from 'apps/brand-service/src/enum/events.names.brand.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesLeadEnum from 'apps/lead-service/src/enum/events.names.lead.enum';
import EventsNamesPermissionEnum from 'apps/permission-service/src/enum/events.names.permission.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesPspEnum from 'apps/psp-service/src/enum/events.names.psp.enum';
import EventsNamesRoleEnum from 'apps/role-service/src/enum/events.names.role.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { ObjectId } from 'mongoose';
import { countries } from '../const/countries.const';
import { countries_currencies } from '../const/countries.currencies.const';

// INITIAL DATA
class CreatorSeedMongoose {
  private crmData: CrmDocument[];
  private pspData: PspDocument[];
  private roleData: RoleDocument[];
  private userData: UserDocument[];
  private leadData: LeadDocument[];
  private statusData: StatusDocument[];
  private pspAccountData: PspAccountDocument[];
  private categoryData: CategoryDocument[];
  private brandData: BrandDocument[];
  private affiliateData: AffiliateDocument[];
  private transferData: TransferDocument[];
  private permissionData: PermissionDocument[];
  private ruleSaved = false;
  private departmentSaved = false;
  private referralSaved = false;
  private transactionSaved = false;
  private countrySaved = false;
  private currencySaved = false;
  private categorySaved = false;
  private bankSaved = false;
  private categoryCrmSaved = false;
  private builder: BuildersService;

  setBuilder(builder: BuildersService) {
    this.builder = builder;
  }

  // INITIAL PERMISSION DATA
  async createInitialPermissionDataList(): Promise<PermissionDocument[]> {
    if (!this.permissionData?.length) {
      const permissionsDto = this.getPermissionsDto();
      this.permissionData = await this.getItemsCreator<
        PermissionCreateDto,
        PermissionDocument
      >(permissionsDto, (dto) =>
        this.builder.getPromisePermissionEventClient<PermissionDocument>(
          EventsNamesPermissionEnum.createOne,
          dto,
        ),
      );
    }
    return this.permissionData;
  }

  // INITIAL ROLE DATA
  async createInitialRoleDataList(): Promise<RoleDocument[]> {
    if (!this.roleData?.length) {
      // TODO[hender] Add permissions to roles guided by index of permissionsData
      const rolesDto = this.getRolesDto();
      this.roleData = await this.getItemsCreator<RoleCreateDto, RoleDocument>(
        rolesDto,
        (dto) =>
          this.builder.getPromiseRoleEventClient<RoleDocument>(
            EventsNamesRoleEnum.createOne,
            dto,
          ),
      );
    }
    return this.roleData;
  }

  async getItemsCreator<TDto = any, TDocument = any>(
    dtos: Array<TDto>,
    functionIterator: (TDto) => Promise<TDocument>,
  ): Promise<TDocument[]> {
    const promises = [];
    for (const dto of dtos) {
      promises.push(functionIterator(dto));
    }
    return Promise.all(promises);
  }

  // INITIAL BRAND DATA
  async createInitialBrandDataList(): Promise<BrandDocument[]> {
    if (!this.brandData?.length) {
      const brandsDto = this.getBrandsDto();
      this.brandData = await this.getItemsCreator<
        BrandCreateDto,
        BrandDocument
      >(brandsDto, (dto) =>
        this.builder.getPromiseBrandEventClient<BrandDocument>(
          EventsNamesBrandEnum.createOne,
          dto,
        ),
      );
    }
    return this.brandData;
  }

  // INITIAL CRM DATA
  async createInitialCrmDataList(): Promise<CrmDocument[]> {
    if (!this.crmData?.length) {
      const crmsDto = await this.getCrmsDto();
      this.crmData = await this.getItemsCreator<CrmCreateDto, CrmDocument>(
        crmsDto,
        (dto) =>
          this.builder.getPromiseCrmEventClient<CrmDocument>(
            EventsNamesCrmEnum.createOne,
            dto,
          ),
      );
    }
    return this.crmData;
  }

  // INITIAL STATUS DATA
  async createInitialStatusDataList(): Promise<StatusDocument[]> {
    if (!this.crmData?.length) {
      const statusesDto = this.getStatusesDto();
      this.statusData = await this.getItemsCreator<
        StatusCreateDto,
        StatusDocument
      >(statusesDto, (dto) =>
        this.builder.getPromiseStatusEventClient<StatusDocument>(
          EventsNamesStatusEnum.createOne,
          dto,
        ),
      );
    }
    return this.statusData;
  }

  // INITIAL PSP DATA
  async createInitialPspDataList(): Promise<PspDocument[]> {
    if (!this.pspData?.length) {
      const pspsDto = this.getPspsDto();
      this.pspData = await this.getItemsCreator<PspCreateDto, PspDocument>(
        pspsDto,
        (dto) =>
          this.builder.getPromisePspEventClient<PspDocument>(
            EventsNamesPspEnum.createOne,
            dto,
          ),
      );
    }
    return this.pspData;
  }

  // INITIAL PSP ACCOUNT DATA
  async createInitialPspAccountDataList(): Promise<PspAccountDocument[]> {
    if (!this.pspAccountData?.length) {
      const pspAccountsDto = await this.getPspAccountsDto();
      this.pspAccountData = await this.getItemsCreator<
        PspAccountCreateDto,
        PspAccountDocument
      >(pspAccountsDto, (dto) =>
        this.builder.getPromisePspAccountEventClient<PspAccountDocument>(
          EventsNamesPspAccountEnum.createOne,
          dto,
        ),
      );
    }
    return this.pspAccountData;
  }

  // INITIAL CATEGORY
  async createInitialCategoryDataList(): Promise<CategoryDocument[]> {
    if (!this.categorySaved) {
      this.categorySaved = true;
      const categoriesDto = this.getCategoriesDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          categoriesDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((category) => {
      return category.type == TagEnum.CATEGORY;
    });
  }

  // INITIAL CATEGORY/DEPARTMENT DATA
  async createInitialCategoryDepartmentDataList(): Promise<CategoryDocument[]> {
    if (!this.departmentSaved) {
      this.departmentSaved = true;
      const departmentsDto = this.getDepartmentsDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          departmentsDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((category) => {
      return category.type == TagEnum.DEPARTMENT;
    });
  }

  // INITIAL CATEGORY/REFERRAL_TYPE DATA
  async createInitialCategoryReferralTypeDataList(): Promise<
    CategoryDocument[]
  > {
    if (!this.referralSaved) {
      this.referralSaved = true;
      const referralTypesDto = this.getReferralTypesDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          referralTypesDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((category) => {
      return category.type == TagEnum.REFERRAL_TYPE;
    });
  }

  // INITIAL CATEGORY/TRANSACTION_TYPE DATA
  async createInitialCategoryMonetaryTransactionDataList(): Promise<
    CategoryDocument[]
  > {
    if (!this.transactionSaved) {
      this.transactionSaved = true;
      const transactionTypesDto = this.getTransferTypesDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          transactionTypesDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((category) => {
      return category.type == TagEnum.MONETARY_TRANSACTION_TYPE;
    });
  }

  getMonetaryTransaction() {
    return this.getCategoryByType(TagEnum.MONETARY_TRANSACTION_TYPE);
  }

  getCategoryByType(type: TagEnum) {
    return this.categoryData.filter((category) => {
      return category.type == type;
    });
  }

  // INITIAL CATEGORY/RULE DATA
  async createInitialCategoryRuleDataList(): Promise<CategoryDocument[]> {
    if (!this.ruleSaved) {
      this.ruleSaved = true;
      const rulesDto = this.getRulesDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          rulesDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((cat) => {
      return cat.type == TagEnum.RULE;
    });
  }

  // INITIAL CATEGORY/CRM DATA
  async createInitialCategoryCrmDataList(): Promise<CategoryDocument[]> {
    if (!this.categoryCrmSaved) {
      this.categoryCrmSaved = true;
      const categoriesCrmDto = this.getCategoriesCrmDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          categoriesCrmDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((cat) => {
      return cat.type == TagEnum.CRM;
    });
  }

  // INITIAL CATEGORY/COUNTRY DATA
  async createInitialCategoryCountryDataList(): Promise<CategoryDocument[]> {
    if (!this.countrySaved) {
      this.countrySaved = true;
      const countriesDto = this.getCountriesDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          countriesDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((cat) => {
      return cat.type == TagEnum.COUNTRY;
    });
  }

  // INITIAL CATEGORY/CURRENCY DATA
  async createInitialCategoryCurrencyDataList(): Promise<CategoryDocument[]> {
    if (!this.currencySaved) {
      this.currencySaved = true;
      const currenciesDto = this.getCurrenciesDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          currenciesDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((cat) => {
      return cat.type == TagEnum.CURRENCY;
    });
  }

  // INITIAL CATEGORY/BANK DATA
  async createInitialCategoryBankDataList(): Promise<CategoryDocument[]> {
    if (!this.bankSaved) {
      this.bankSaved = true;
      const banksDto = this.getBanksDto();
      this.categoryData = this.categoryData || [];
      this.categoryData = this.categoryData.concat(
        await this.getItemsCreator<CategoryCreateDto, CategoryDocument>(
          banksDto,
          (dto) =>
            this.builder.getPromiseCategoryEventClient<CategoryDocument>(
              EventsNamesCategoryEnum.createOne,
              dto,
            ),
        ),
      );
    }
    return this.categoryData.filter((cat) => {
      return cat.type == TagEnum.BANK;
    });
  }

  // INITIAL USER DATA
  async createInitialUserDataList() {
    if (!this.userData?.length) {
      if (!this.roleData?.length) {
        throw new BadRequestException('Need roles to save user');
      }
      const usersDto = this.getUsersDto();
      this.userData = await this.getItemsCreator<UserRegisterDto, UserDocument>(
        usersDto,
        (dto) =>
          this.builder.getPromiseUserEventClient<UserDocument>(
            EventsNamesUserEnum.createOne,
            dto,
          ),
      );
    }
    return this.userData;
  }

  // INITIAL AFFILIATE DATA
  async createInitialAffiliateDataList() {
    if (!this.affiliateData?.length) {
      const affiliatesDto = this.getAffiliatesDto();
      this.affiliateData = await this.getItemsCreator<
        AffiliateCreateDto,
        AffiliateDocument
      >(affiliatesDto, (dto) =>
        this.builder.getPromiseAffiliateEventClient<AffiliateDocument>(
          EventsNamesAffiliateEnum.createOne,
          dto,
        ),
      );
    }
    return this.affiliateData;
  }

  // INITIAL LEAD DATA
  async createInitialLeadDataList(quantityLeads = 1) {
    if (!this.leadData?.length) {
      const leadsDto = this.getLeadsDto(this.affiliateData[0], quantityLeads);
      this.leadData = await this.getItemsCreator<
        CreateLeadAffiliateDto,
        LeadDocument
      >(leadsDto, (dto) =>
        this.builder.getPromiseLeadEventClient<LeadDocument>(
          EventsNamesLeadEnum.addLeadFromAffiliate,
          dto,
        ),
      );
    }
    return this.leadData;
  }

  // INITIAL TRANSFER DATA
  async createInitialTransferDataList() {
    if (!this.transferData?.length) {
      const transfersDto = await this.getTransfersDto();
      this.transferData = await this.getItemsCreator<
        TransferCreateDto,
        TransferDocument
      >(transfersDto, (dto) =>
        this.builder.getPromiseTransferEventClient<TransferDocument>(
          EventsNamesTransferEnum.createOne,
          dto,
        ),
      );
    }
    return this.transferData;
  }

  private createPermissionDto(
    action: ActionsEnum,
    resource: ResourcesEnum,
    scope?: ScopeDto,
    timeLive?: TimeLiveDto,
  ): PermissionCreateDto {
    return {
      action: action,
      resource: resource,
      description: action + ' ' + resource,
      name: action + ' ' + resource,
      code: '',
      scope: scope,
      timeLive:
        timeLive ||
        {
          //from: new Date(),
          //to: new Date(),
        },
    } as PermissionCreateDto;
  }
  private createRoleDto(
    name: string,
    description = '',
    permissions = [],
    active = true,
  ): RoleCreateDto {
    return {
      name: name,
      active: active,
      description: description,
      permissions: permissions,
    } as RoleCreateDto;
  }
  private createBrandDto(
    name: string,
    description: string,
    department: ObjectId,
    currentCrm = undefined,
    crmList = [],
    pspList = [],
    slug = CommonService.getSlug(name),
  ): BrandCreateDto {
    return {
      name,
      slug,
      description,
      department,
      currentCrm,
      crmList,
      pspList,
    } as unknown as BrandCreateDto;
  }
  private createCrmDto(
    name: string,
    description: string,
    department: string,
    url: string,
    brand: string,
    status: string,
    category: string,
    buOwnerIdCrm: string,
    tradingPlatformIdCrm: string,
    organizationCrm: string,
    idCrm: string,
    secretCrm: string,
    userCrm: string,
    passwordCrm: string,
    pspAvailable?: string[],
    statusAvailable?: string[],
    groupsPspOption?: string[],
  ): CrmCreateDto {
    return {
      name,
      description,
      department,
      url,
      status,
      brand: brand,
      buOwnerIdCrm,
      tradingPlatformIdCrm,
      organizationCrm,
      idCrm,
      secretCrm,
      userCrm,
      passwordCrm,
      category,
      pspAvailable,
      statusAvailable,
      groupsPspOption,
    } as CrmCreateDto;
  }
  private createStatusDto(
    name: string,
    description: string,
    resources?: ResourcesEnum[],
  ): StatusCreateDto {
    return {
      name,
      slug: CommonService.getSlug(name),
      description,
      resources,
    } as StatusCreateDto;
  }
  private createPspDto(
    name: string,
    description: string,
    status = '',
    groups = [],
  ): PspCreateDto {
    return {
      name,
      description,
      status,
      groups,
    } as PspCreateDto;
  }
  private createPspAccountDto({
    name = '',
    description = '',
    accountId = '',
    apiKey = '',
    publicKey = '',
    privateKey = '',
    token = '',
    hashNotification = '',
    urlApi = '',
    urlSandbox = '',
    urlDashboard = '',
    username = '',
    password = '',
    psp = '',
    bank = '',
    status = '',
    creator = '',
  }): PspAccountCreateDto {
    return {
      name,
      description,
      apiKey,
      publicKey,
      privateKey,
      token,
      accountId,
      hashNotification,
      urlApi,
      urlSandbox,
      urlDashboard,
      username,
      password,
      psp,
      bank,
      status,
      creator,
    } as unknown as PspAccountCreateDto;
  }
  private createCategoryDto(
    name: string,
    description: string,
    type: TagEnum,
    resources: ResourcesEnum[],
    valueNumber?: number,
    valueText?: string,
  ): CategoryCreateDto {
    return {
      name,
      description,
      type,
      resources,
      valueNumber,
      valueText,
    } as CategoryCreateDto;
  }
  private createUserDto(
    name: string,
    email: string,
    password: string,
    role = '',
  ): UserRegisterDto {
    return {
      name,
      email,
      password,
      confirmPassword: password,
      role,
    } as UserRegisterDto;
  }
  private createAffiliateDto(
    name: string,
    telephone: string,
    docId: string,
    email: string,
    description: string,
    conversionCost: number,
    crm: string,
    user: UserRegisterDto,
    personalData: PersonCreateDto,
    organization,
    buOwnerId,
    tradingPlatformId,
    group?: string,
    publicKey?: string,
    ipAllowed?: string[],
    brand?: string,
    crmIdAffiliate?: string,
    crmApiKeyAffiliate?: string,
    crmTokenAffiliate?: string,
    crmUsernameAffiliate?: string,
    crmPasswordAffiliate?: string,
    crmDateToExpireSecretKeyAffiliate?: Date,
  ): AffiliateCreateDto {
    return {
      name,
      telephone,
      docId,
      email,
      description,
      crmIdAffiliate,
      crmApiKeyAffiliate,
      crmTokenAffiliate,
      crmDateToExpireSecretKeyAffiliate,
      crmUsernameAffiliate,
      crmPasswordAffiliate,
      conversionCost,
      user,
      group,
      ipAllowed,
      personalData,
      publicKey,
      brand: brand,
      crm,
      organization,
      buOwnerId,
      tradingPlatformId,
    } as unknown as AffiliateCreateDto;
  }
  private createLeadDto(
    name: string,
    telephone: string,
    docId: string,
    email: string,
    description: string,
    crmIdLead: string,
    password: string,
    referral: string,
    referralType: string,
    affiliate: string,
    crm: string,
    brand: string,
    group?: string,
    status?: string,
    statusCrm?: string,
    personalData?: PersonCreateDto,
    user?: UserRegisterDto,
    pspsUsed?: string[],
  ): LeadCreateDto {
    return {
      name,
      telephone,
      docId,
      email,
      description,
      crmIdLead,
      password,
      referral,
      referralType,
      affiliate,
      crm,
      brand,
      group,
      status,
      statusCrm,
      personalData,
      user,
      pspsUsed,
    } as unknown as LeadCreateDto;
  }
  private createLeadDtoToAffiliate(
    data: CreateLeadAffiliateDto,
  ): CreateLeadAffiliateDto {
    return data;
  }
  private createPersonDto(
    numDocId: string,
    typeDocId: string,
    firstName: string,
    lastName: string,
    description: string,
    email: string,
    emails: string[],
    telephones: TelephoneDto[],
    location?: LocationDto,
    country?: string,
  ): PersonCreateDto {
    return {
      numDocId,
      typeDocId,
      firstName,
      lastName,
      description,
      email,
      emails,
      telephones,
      location,
      country,
      //birth :BirthModel,
      //job :JobModel,
      //gender :GenderEnum,
      //kyc :KyCModel,
      //user: string;
      //affiliates: string[];
      //leads: string[];
    } as PersonCreateDto;
  }
  private createTelephoneDto(
    countryName: CountryCodeEnum,
    phoneNumber: string,
    phoneName?: string,
    category?: string,
  ): TelephoneDto {
    return {
      countryName,
      phoneNumber,
      phoneName,
      category,
    } as TelephoneDto;
  }
  private createTransferDto(
    name: string,
    description: string,
    currency: CurrencyCodeB2cryptoEnum,
    amount: number,
    lead: string,
    pspAccount: string,
    typeTransaction: string,
    operationType: OperationTransactionType,
    page: string,
    idPayment: string,
    statusPayment: string,
    approve: boolean,
    status: string,
    department: string,
    confirmedAt?: Date,
    approvedAt?: Date,
    rejectedAt?: Date,
    affiliate?: string,
    leadEmail?: string,
    leadTpId?: string,
    leadCrmName?: string,
    leadCountry?: CountryCodeEnum,
    leadPsp?: string,
    psp?: string,
    bank?: string,
    brand?: string,
    crm?: string,
  ): TransferCreateDto {
    return {
      name,
      description,
      currency,
      amount,
      lead,
      leadEmail,
      leadTpId,
      leadCrmName,
      leadCountry,
      leadPsp,
      pspAccount,
      typeTransaction,
      operationType,
      page,
      idPayment,
      statusPayment,
      approve,
      status,
      affiliate,
      department,
      psp,
      bank,
      brand: brand,
      crm,
      confirmedAt,
      approvedAt,
      rejectedAt,
    } as unknown as TransferCreateDto;
  }

  private getPermissionsDto() {
    return [
      this.createPermissionDto(ActionsEnum.MANAGE, ResourcesEnum.ALL),
      // MENU
      this.createPermissionDto(ActionsEnum.VIEW, ResourcesEnum.VIEW_CFTD),
      this.createPermissionDto(ActionsEnum.VIEW, ResourcesEnum.TRANSFER_FTD),
      this.createPermissionDto(ActionsEnum.VIEW, ResourcesEnum.PAYSYS),
      this.createPermissionDto(ActionsEnum.VIEW, ResourcesEnum.STATS_TRANSFER),
      this.createPermissionDto(ActionsEnum.VIEW, ResourcesEnum.GENERAL_LEADS),
      this.createPermissionDto(ActionsEnum.VIEW, ResourcesEnum.DATABASE),
      this.createPermissionDto(
        ActionsEnum.VIEW,
        ResourcesEnum.DETAIL_TOTAL_FTD,
      ),
      // CREATE LIST
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.ACTIVITY),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.AFFILIATE),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.BRAND),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.CATEGORY),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.CRM),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.FILE),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.GROUP),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.IP_ADDRESS),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.LEAD),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.MESSAGE),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.PERMISSION),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.PERSON),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.PSP),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.ROLE),
      this.createPermissionDto(
        ActionsEnum.CREATE,
        ResourcesEnum.STATS_AFFILIATE,
      ),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.STATUS),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.TRANSFER),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.TRAFFIC),
      this.createPermissionDto(
        ActionsEnum.CREATE,
        ResourcesEnum.MONETARY_TRANSACTION,
      ),
      this.createPermissionDto(ActionsEnum.CREATE, ResourcesEnum.USER),
      // UPDATE LIST
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.ACTIVITY),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.AFFILIATE),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.BRAND),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.CATEGORY),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.CRM),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.FILE),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.GROUP),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.IP_ADDRESS),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.LEAD),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.MESSAGE),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.PERMISSION),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.PERSON),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.PSP),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.ROLE),
      this.createPermissionDto(
        ActionsEnum.UPDATE,
        ResourcesEnum.STATS_AFFILIATE,
      ),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.STATUS),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.TRANSFER),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.TRAFFIC),
      this.createPermissionDto(
        ActionsEnum.UPDATE,
        ResourcesEnum.MONETARY_TRANSACTION,
      ),
      this.createPermissionDto(ActionsEnum.UPDATE, ResourcesEnum.USER),
      // READ LIST
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.ACTIVITY),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.AFFILIATE),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.BRAND),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.CATEGORY),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.CRM),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.FILE),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.GROUP),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.IP_ADDRESS),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.LEAD),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.MESSAGE),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.PERMISSION),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.PERSON),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.PSP),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.ROLE),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.STATS_AFFILIATE),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.STATUS),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.TRANSFER),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.TRAFFIC),
      this.createPermissionDto(
        ActionsEnum.READ,
        ResourcesEnum.MONETARY_TRANSACTION,
      ),
      this.createPermissionDto(ActionsEnum.READ, ResourcesEnum.USER),
    ];
  }
  private getRolesDto() {
    return [
      this.createRoleDto('Super Admin', 'User super admin'),
      this.createRoleDto('Admin', 'User admin'),
      this.createRoleDto('Support', 'User support'),
      this.createRoleDto('Manager', 'User affiliate manager'),
      this.createRoleDto('Affiliate', 'User affiliate'),
      this.createRoleDto('Lead', 'User lead'),
      this.createRoleDto('Basic', 'User basic'),
      this.createRoleDto('Advance', 'User advance'),
    ];
  }
  private getBrandsDto() {
    const sales = this.getCategoryByType(TagEnum.DEPARTMENT).filter(
      (department) => department.slug === 'sales',
    )[0];
    const retention = this.getCategoryByType(TagEnum.DEPARTMENT).filter(
      (department) => department.slug === 'retention',
    )[0];
    return [
      this.createBrandDto(
        'FxTrategy',
        'Brand FxTrategy sales',
        sales._id,
        //this.crmData[0],
      ),
      this.createBrandDto(
        'FxTrategy Retention',
        'Brand FxTrategy retention',
        retention._id,
        //this.crmData[0],
      ),
      this.createBrandDto(
        'Solutraders',
        'Brand Solutraders sales',
        sales._id,
        //this.crmData[0],
      ),
      this.createBrandDto(
        'BearInvester',
        'Brand BearInvester sales',
        sales._id,
        //this.crmData[0],
      ),
      this.createBrandDto(
        'Noimarkets',
        'Brand noimarkets sales',
        sales._id,
        //this.crmData[1]._id,
      ),
      this.createBrandDto(
        'AllMarkets',
        'Brand AllMarkets sales',
        retention._id,
        //this.crmData[0],
      ),
      this.createBrandDto(
        'UBM Capital',
        'Brand UBM Capital sales',
        retention._id,
        //this.crmData[0],
      ),
      // Sin saber si son SALES o RETENTION
      /*
      this.createBrandDto(
        'SalesHub',
        'Brand SalesHub sales',
        sales._id,
        //this.crmData[2]._id,
      ),
      this.createBrandDto(
        'Fxpertos',
        'Brand Fxpertos sales',
        sales._id,
        //this.crmData[2]._id,
      ),
      */
      this.createBrandDto(
        'InverLion',
        'Brand inverlion',
        retention._id,
        //this.crmData[0],
      ),
      this.createBrandDto(
        'Profitbitz',
        'Brand Profitbitz sales',
        sales._id,
        //this.crmData[6]._id,
      ),
      this.createBrandDto(
        'FxIntegral',
        'Brand FxIntegral sales',
        sales._id,
        //this.crmData[6]._id,
      ),
      /*
      this.createBrandDto(
        'FxBravo',
        'Brand FxBravo',
        //this.crmData[2]._id,
      ),
      this.createBrandDto(
        'FxMundo',
        'Brand FxMundo',
        //this.crmData[3]._id,
      ),
      this.createBrandDto(
        'Ascending Bull',
        'Brand Ascending Bull',
        //this.crmData[4]._id,
      ),
      this.createBrandDto(
        'Adrswap',
        'Brand Adrswap',
        //this.crmData[7]._id,
      ), */
    ];
  }
  private async getCrmsDto() {
    const sales = this.getCategoryByType(TagEnum.DEPARTMENT).filter(
      (department) => department.slug === 'sales',
    )[0];
    const retention = this.getCategoryByType(TagEnum.DEPARTMENT).filter(
      (department) => department.slug === 'retention',
    )[0];
    const crmTypes = this.getCategoryByType(TagEnum.CRM);
    return [
      this.createCrmDto(
        'Brand Sales',
        'Brand sales',
        sales._id,
        'https://app.tradingcrm.com/',
        this.brandData[0]._id,
        this.statusData[0]._id,
        crmTypes[1]._id,
        'F3D2537B-1505-EE11-B4FA-001056B1159A',
        'FE987982-0206-EE11-B4F9-002056B1CC58',
        'latamgroup',
        'c8b64792-0506-ee11-b4f9-009056b1cc58',
        'JVM7A66H3R6P66DM3KH2LEOQ4VHTJ5VE',
        'brand_sales',
        'Afgy92sb0j*',
      ),
    ];
  }
  private getStatusesDto() {
    return [
      this.createStatusDto('Active', 'Status active', [ResourcesEnum.ALL]),
      this.createStatusDto('Approved', 'Status Transaction approved', [
        ResourcesEnum.TRANSFER,
      ]),
      this.createStatusDto('Rejected', 'Status Transaction rejected', [
        ResourcesEnum.TRANSFER,
      ]),
      this.createStatusDto('Sended', 'Status Transaction sended', [
        ResourcesEnum.TRANSFER,
      ]),
      this.createStatusDto('Pending', 'Status Transaction pending', [
        ResourcesEnum.TRANSFER,
      ]),
      this.createStatusDto('Inactive', 'Status inactive', [ResourcesEnum.ALL]),
      this.createStatusDto('Moved', 'Status moved', [ResourcesEnum.LEAD]),
      this.createStatusDto('CFTD', 'Status CFTD of Lead', [ResourcesEnum.LEAD]),
      this.createStatusDto('FTD', 'Status FTD of Lead', [ResourcesEnum.LEAD]),
      this.createStatusDto('Contacted', 'Status when contacted to Lead', [
        ResourcesEnum.LEAD,
      ]),
      this.createStatusDto('Message', 'Status when left a message to Lead', [
        ResourcesEnum.LEAD,
      ]),
      this.createStatusDto('G - NAN', '100', [ResourcesEnum.CRM]),
      this.createStatusDto('G - Potential', '2', [ResourcesEnum.CRM]),
      this.createStatusDto('G - Follow up', '3', [ResourcesEnum.CRM]),
      this.createStatusDto('G - No answer', '4', [ResourcesEnum.CRM]),
      this.createStatusDto('G - Call back', '5', [ResourcesEnum.CRM]),
      this.createStatusDto('G - Wrong Number', '111', [ResourcesEnum.CRM]),
      this.createStatusDto('G - New', '1', [ResourcesEnum.CRM]),
      this.createStatusDto('B - No Money', '6', [ResourcesEnum.CRM]),
      this.createStatusDto('B - No link/Disconected', '106', [
        ResourcesEnum.CRM,
      ]),
      this.createStatusDto('B - No interested', '107', [ResourcesEnum.CRM]),
      this.createStatusDto('B - Test', '108', [ResourcesEnum.CRM]),
      this.createStatusDto('B - Duplicate', '109', [ResourcesEnum.CRM]),
      this.createStatusDto('B - Underage', '110', [ResourcesEnum.CRM]),
      this.createStatusDto('B - Zero contact', '115', [ResourcesEnum.CRM]),
    ];
  }
  private getPspsDto() {
    return [this.createPspDto('ePayco', 'ePayco', this.statusData[0]._id)];
  }
  private async getPspAccountsDto() {
    const bankList = await this.createInitialCategoryBankDataList();
    return [
      this.createPspAccountDto({
        name: 'ePayco 1',
        description: 'ePayco 1',
        apiKey: 'a5ea24fc22606560b356a6dcb16f48a13b30b8fc',
        publicKey: '48c90e334265ae962a94fa7f54870423',
        privateKey: '6d743b9a029538016fac07cf36d018f7',
        accountId: '673589',
        psp: this.pspData[0]._id,
        bank: bankList[0]?._id,
        status: this.statusData[0]._id,
        creator: this.userData[0]._id,
      }),
    ];
  }
  private getTransferTypesDto() {
    const type = TagEnum.MONETARY_TRANSACTION_TYPE;
    return [
      this.createCategoryDto('Cash', 'Payment with cash', type, [
        ResourcesEnum.TRANSFER,
      ]),
      this.createCategoryDto(
        'Transfer',
        'Payment with bancary transfer',
        type,
        [ResourcesEnum.TRANSFER],
      ),
      this.createCategoryDto('Credit Card', 'Payment with credit card', type, [
        ResourcesEnum.TRANSFER,
      ]),
    ];
  }

  private getCategoriesDto() {
    const type = TagEnum.CATEGORY;
    return [
      this.createCategoryDto(
        'Latin America',
        'Category Latin America',
        type,
        [ResourcesEnum.CATEGORY],
        0,
        'LATAM',
      ),
    ];
  }

  private getDepartmentsDto() {
    const type = TagEnum.DEPARTMENT;
    return [
      this.createCategoryDto(
        'Retention',
        'Retention department',
        type,
        [ResourcesEnum.CRM, ResourcesEnum.BRAND],
        0,
        'RTT',
      ),
      this.createCategoryDto(
        'Sales',
        'Sales department',
        type,
        [ResourcesEnum.CRM, ResourcesEnum.BRAND],
        1,
        'SLL',
      ),
    ];
  }
  private getReferralTypesDto() {
    const type = TagEnum.REFERRAL_TYPE;
    return [
      this.createCategoryDto(
        'Google',
        'Source type Google',
        type,
        [ResourcesEnum.ALL],
        0,
        'GGL',
      ),
      this.createCategoryDto(
        'Facebook',
        'Source type Facebook',
        type,
        [ResourcesEnum.ALL],
        1,
        'FBK',
      ),
      this.createCategoryDto(
        'Instagram',
        'Source type Instagram',
        type,
        [ResourcesEnum.ALL],
        2,
        'ING',
      ),
      this.createCategoryDto(
        'Internal',
        'Source type Internal',
        type,
        [ResourcesEnum.ALL],
        3,
        'INT',
      ),
    ];
  }
  private getRulesDto() {
    const type = TagEnum.RULE;
    return [
      this.createCategoryDto(
        'is new lead',
        'Time in seconds to call a lead "new"',
        type,
        [ResourcesEnum.ALL],
        24 * 60 * 60,
      ),
      this.createCategoryDto(
        'Money to CFTD from lead',
        'Amount of money in USD to convert a lead to cftd',
        type,
        [ResourcesEnum.ALL],
        250,
      ),
    ];
  }
  private getCategoriesCrmDto() {
    const type = TagEnum.CRM;
    return [
      this.createCategoryDto('Antelope', 'CRM antelope', type, [
        ResourcesEnum.ALL,
      ]),
      this.createCategoryDto('Leverate', 'CRM Leverate', type, [
        ResourcesEnum.ALL,
      ]),
    ];
  }
  private getCountriesDto() {
    const type = TagEnum.COUNTRY;
    const countriesDto = [];
    for (const country of countries) {
      countriesDto.push(
        this.createCategoryDto(
          country.alpha2,
          country.country,
          type,
          [ResourcesEnum.ALL],
          parseInt(country.num3),
          country.alpha2,
        ),
      );
    }
    return countriesDto;
  }
  private getCurrenciesDto() {
    const type = TagEnum.CURRENCY;
    const currenciesDto = [];
    for (const currency of countries_currencies) {
      const country = countries.find((v) => v.alpha2 == currency.country);
      currenciesDto.push(
        this.createCategoryDto(
          country.country,
          country.alpha3,
          type,
          [ResourcesEnum.ALL],
          0,
          currency.currency,
        ),
      );
    }
    return currenciesDto;
  }
  private getBanksDto() {
    const type = TagEnum.BANK;
    const banksDto = [];
    banksDto.push(
      this.createCategoryDto(
        'HSBC',
        'Banco Hong Kong and Shangai Banking Corporation',
        type,
        [ResourcesEnum.ALL],
        0,
        'MRMDUS33XXX',
      ),
      this.createCategoryDto(
        'BBVA',
        'Banco Bilvao Vizcaya Argentaria',
        type,
        [ResourcesEnum.ALL],
        0,
        'GEROXXXX',
      ),
    );
    return banksDto;
  }
  private getUsersDto() {
    return [
      this.createUserDto(
        'Mauricio',
        'mauricio@b2crypto.com',
        '123Abc',
        this.roleData[0]._id,
      ),
      this.createUserDto(
        'Julian',
        'julian@b2crypto.com',
        '123Abc',
        this.roleData[0]._id,
      ),
      this.createUserDto(
        'Daniel',
        'daniel@b2crypto.com',
        '123Abc',
        this.roleData[0]._id,
      ),
      this.createUserDto(
        'hender',
        'hender@b2crypto.com',
        '123Abc',
        this.roleData[0]._id,
      ),
      this.createUserDto(
        'hamilton',
        'hamilton@b2crypto.com',
        '123Abc',
        this.roleData[0]._id,
      ),
    ];
  }
  private getAffiliatesDto() {
    const affiliates: AffiliateCreateDto[] = [];
    const quantityCreate = 2;
    const affiliatesCrmBrandSales = this.getAffiliates({
      quantityCreate: quantityCreate,
      crmId: this.crmData[0]._id,
      crmApiKey: null,
      tradingPlatformId: this.crmData[0].tradingPlatformIdCrm,
      organization: this.crmData[0].organizationCrm,
      buOwnerId: this.crmData[0].buOwnerIdCrm,
      username: this.crmData[0].userCrm,
      password: this.crmData[0].passwordCrm,
      startId: 0,
      brandId: this.brandData[0]._id,
      brandName: this.brandData[0].slug,
    });
    const allAffiliates = affiliates.concat(affiliatesCrmBrandSales);
    return allAffiliates;
  }
  getAffiliates(config: ConfigAffiliate): Array<AffiliateCreateDto> {
    const affiliates = [];
    const persons = this.getPersons({
      //quantityCreate: 35,
      quantityCreate: config.quantityCreate ?? 1,
      seedNumDocId: '9876543210',
      typeDocId: DocIdTypeEnum.CEDULA_CIUDADANIA,
      seedFirstName: 'Affiliate ',
      seedLastName: config.brandName + ' ',
      seedDescription: 'Affiliate ' + config.brandName + ' ',
      seedEmail: 'affiliate_' + config.brandName + '_{e}@email.com',
      seedTelephones: '3216549880',
    });
    persons.forEach((person, idx) => {
      const fullName = person.firstName + ' ' + person.lastName;
      affiliates.push(
        this.createAffiliateDto(
          fullName,
          person.telephones[0].phoneNumber,
          person.typeDocId + person.numDocId,
          person.email,
          person.description,
          10,
          config.crmId,
          this.createUserDto(
            fullName,
            person.emails[0],
            '123Abc',
            this.roleData[4]._id,
          ),
          person,
          config.organization,
          config.buOwnerId,
          config.tradingPlatformId,
          null,
          '',
          ['192.168.1.' + idx],
          config.brandId,
          (config.startId + idx).toString(),
          config.crmApiKey ?? null,
          null,
          config.username ?? person.email,
          config.password ?? CommonService.getHash(fullName, 2),
        ),
      );
    });
    return affiliates;
  }
  getPersons(config: ConfigPerson): Array<PersonCreateDto> {
    const persons = [];
    for (let h = 0; h < config.quantityCreate; h++) {
      const email = (config.seedEmail ?? 'person{e}@email.com').replace(
        '{e}',
        h + '',
      );
      persons.push(
        this.createPersonDto(
          (config.seedNumDocId ?? '') + h,
          config.typeDocId,
          (config.seedFirstName ?? '') + h,
          (config.seedLastName ?? '') + h,
          (config.seedDescription ?? '') + h,
          email,
          [email],
          [
            this.createTelephoneDto(
              CountryCodeEnum.Colombia,
              (config.seedTelephones ?? '') + h,
            ),
          ],
        ),
      );
    }
    return persons;
  }
  private getLeadsDtoByAffiliate() {
    let leads: CreateLeadAffiliateDto[] = [];
    for (const affiliate of this.affiliateData) {
      leads = leads.concat(this.getLeadsDto(affiliate));
    }
    return leads;
  }
  private getLeadsDto(affiliate = null, quantityCreate = 1) {
    const affiliateRandom = !affiliate;
    const leads: CreateLeadAffiliateDto[] = [];
    const referralTypes = this.categoryData.filter((category) => {
      return category.type == TagEnum.REFERRAL_TYPE;
    });
    const persons = this.getPersons({
      quantityCreate: quantityCreate,
      seedNumDocId: '9876543211',
      typeDocId: DocIdTypeEnum.CEDULA_CIUDADANIA,
      seedFirstName: 'Lead ',
      seedLastName: 'Person ',
      seedDescription: 'Lead Seed ',
      seedEmail: 'lead_{e}@email.com',
      seedTelephones: '3216549881',
    });
    persons.forEach((person, idx) => {
      const fullName = person.firstName + ' ' + person.lastName;
      const idxReferralType = CommonService.randomIntNumber(
        referralTypes.length - 1,
      );
      const idxCountry = CommonService.randomIntNumber(countries.length - 1);
      if (affiliateRandom) {
        const idxAffiliate = CommonService.randomIntNumber(
          this.affiliateData.length,
        );
        affiliate = this.affiliateData[idxAffiliate];
      }
      leads.push(
        this.createLeadDtoToAffiliate({
          /* tradingPlatformId: affiliate.tradingPlatformId,
          buOwnerId: affiliate.buOwnerId,
          organization: affiliate.organization, */
          name: `${fullName}`,
          description: `${person.description} Lead ${idx + 1} for ${
            affiliate.name
          }`,
          referral: 'http://ulr-referral-or-source-lead-' + idx + '.com',
          referralType: referralTypes[idxReferralType]._id,
          email: person.email,
          telephone: person.telephones[0].phoneNumber,
          numDocId: person.numDocId,
          typeDocId: DocIdTypeEnum.CEDULA_CIUDADANIA,
          countryIso: CountryCodeEnum[countries[idxCountry].country],
          secretKey: affiliate.publicKey,
        }),
      );
    });
    return leads;
  }
  private async getTransfersDto() {
    const transfers: TransferCreateDto[] = [];
    const typeTransactions = this.getMonetaryTransaction();
    for (let lead of this.leadData) {
      lead = await this.builder.getPromiseLeadEventClient(
        EventsNamesLeadEnum.findOneById,
        lead.id,
      );
      const currency = this.getRandomEnum(CurrencyCodeB2cryptoEnum);
      const pspAccountItem = this.pspAccountData[0];
      const idxTypeTransaction = CommonService.randomIntNumber(
        typeTransactions.length - 1,
      );
      const crm = this.crmData.filter((crm) => (crm._id = lead.crm))[0];
      const brand = this.brandData.filter(
        (brand) => (brand._id = lead.brand),
      )[0];
      transfers.push(
        this.createTransferDto(
          'Transfer ' + lead.name,
          'Transfer ' + currency,
          currency,
          CommonService.randomIntNumber(99),
          lead._id,
          pspAccountItem._id,
          typeTransactions[idxTypeTransaction]._id,
          //this.getRandomEnum(OperationTransactionType),
          OperationTransactionType.deposit,
          'https://url-page-from-pay.com',
          null,
          null,
          false,
          this.statusData[0]._id,
          null,
          null, // confirmedAt
          null, // approvedAt
          null, //rejectedAt
          lead.affiliate.id ?? lead.affiliate,
          lead.email,
          lead.crmIdLead,
          crm.name,
          lead.country,
          null,
          ((pspAccountItem.psp && pspAccountItem.psp._id) ||
            pspAccountItem.psp) + '',
          ((pspAccountItem.bank && pspAccountItem.bank?._id) ||
            pspAccountItem.bank) + '',
          brand._id,
          crm._id + '',
        ),
      );
    }
    return transfers;
  }

  private getRandomEnum<T>(anEnum: T): T[keyof T] {
    const enumValues = Object.values(anEnum) as unknown as T[keyof T][];
    const randomIndex = Math.floor(Math.random() * enumValues.length);
    return enumValues[randomIndex];
  }
}
const creator = new CreatorSeedMongoose();

export default creator;

interface ConfigAffiliate {
  quantityCreate: number;
  crmId: string;
  crmApiKey: string;
  tradingPlatformId: string;
  organization: string;
  buOwnerId: string;
  username: string;
  password: string;
  startId: number;
  brandId: string;
  brandName: string;
}
interface ConfigPerson {
  quantityCreate: number;
  seedNumDocId: string;
  typeDocId: DocIdTypeEnum;
  seedFirstName: string;
  seedLastName: string;
  seedDescription: string;
  seedEmail: string;
  seedTelephones: string;
}
