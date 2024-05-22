import { AffiliateServiceMongooseService } from '@affiliate/affiliate';
import { AffiliateDocument } from '@affiliate/affiliate/infrastructure/mongoose/affiliate.schema';
import { BrandDocument } from '@brand/brand/entities/mongoose/brand.schema';
import { BuildersService } from '@builder/builders';
import dbIntegrationEnum from '@builder/builders/enums/db-integration.enum';
import { CategoryServiceMongooseService } from '@category/category';
import { CategoryDocument } from '@category/category/entities/mongoose/category.schema';
import { CommonService } from '@common/common';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { CrmServiceMongooseService } from '@crm/crm';
import { CrmDocument } from '@crm/crm/entities/mongoose/crm.schema';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PersonServiceMongooseService } from '@person/person';
import { PersonCreateDto } from '@person/person/dto/person.create.dto';
import { PersonDocument } from '@person/person/entities/mongoose/person.schema';
import { StatusServiceMongooseService } from '@status/status';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import { BrandServiceMongooseService } from 'libs/brand/src';
import { Model, isValidObjectId } from 'mongoose';
import { AccountCreateDto } from './dto/account.create.dto';
import { AccountUpdateDto } from './dto/account.update.dto';
import { Account, AccountDocument } from './entities/mongoose/account.schema';

@Injectable()
export class AccountServiceMongooseService extends BasicServiceModel<
  AccountDocument,
  Model<AccountDocument>,
  AccountCreateDto,
  AccountUpdateDto
> {
  constructor(
    @Inject('ACCOUNT_MODEL_MONGOOSE')
    private accountModel: Model<AccountDocument>,
  ) {
    super(accountModel);
  }

  getSearchText(account: Account) {
    return (
      account.country +
      CommonService.getSeparatorSearchText() +
      account.docId +
      CommonService.getSeparatorSearchText() +
      account.email +
      CommonService.getSeparatorSearchText() +
      account.firstName +
      CommonService.getSeparatorSearchText() +
      account._id?.toString() +
      CommonService.getSeparatorSearchText() +
      account.lastName +
      CommonService.getSeparatorSearchText() +
      account.name +
      CommonService.getSeparatorSearchText() +
      account.audience +
      CommonService.getSeparatorSearchText() +
      account.grantType +
      CommonService.getSeparatorSearchText() +
      account.secret +
      CommonService.getSeparatorSearchText() +
      account.slug +
      CommonService.getSeparatorSearchText() +
      account.telephone +
      CommonService.getSeparatorSearchText() +
      account.country +
      CommonService.getSeparatorSearchText() +
      account.accountId +
      CommonService.getSeparatorSearchText() +
      account.accountPassword +
      CommonService.getSeparatorSearchText() +
      account.accountDepartment?.searchText +
      CommonService.getSeparatorSearchText() +
      account.accountId +
      CommonService.getSeparatorSearchText() +
      account.description +
      CommonService.getSeparatorSearchText() +
      account.referral +
      CommonService.getSeparatorSearchText() +
      account.userIp +
      CommonService.getSeparatorSearchText() +
      account.referralType?.searchText +
      CommonService.getSeparatorSearchText() +
      account.status?.searchText +
      CommonService.getSeparatorSearchText() +
      account.affiliate?.searchText +
      CommonService.getSeparatorSearchText() +
      account.brand?.searchText +
      CommonService.getSeparatorSearchText() +
      account.crm?.searchText +
      CommonService.getSeparatorSearchText() +
      account.personalData?.searchText
    );
  }
}
