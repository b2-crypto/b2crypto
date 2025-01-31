import { Traceable } from '@amplication/opentelemetry-nestjs';
import { CommonService } from '@common/common';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { Inject, Injectable } from '@nestjs/common';
import { isArray, isMongoId } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { AccountCreateDto } from './dto/account.create.dto';
import { AccountUpdateDto } from './dto/account.update.dto';
import { Account, AccountDocument } from './entities/mongoose/account.schema';

@Traceable()
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

  async groupByNetwork(query: QuerySearchAnyDto) {
    const aggregate = this.accountModel.aggregate();
    if (query.where) {
      for (const key in query.where) {
        if (isArray(query.where[key])) {
          if (key === '$or') {
            for (const attrOR in query.where[key]) {
              for (const attr in query.where[key][attrOR]) {
                query.where[key][attrOR][attr] = CommonService.checkDateAttr(
                  query.where[key][attrOR][attr],
                );
              }
            }
            continue;
          }
          query.where[key] = {
            $in: query.where[key].map((item) => new ObjectId(item)),
          };
        } else if (isMongoId(query.where[key])) {
          query.where[key] = new ObjectId(query.where[key]);
        } else if (query.where[key]['start'] || query.where[key]['end']) {
          query.where[key] = CommonService.checkDateAttr(query.where[key]);
        }
      }
      aggregate.match(query.where);
    }
    if (query.order) {
      const sort = {};
      for (const order of query.order) {
        sort[order[0]] = order[1];
      }
      aggregate.sort(sort);
    }
    aggregate.group({
      _id: '$nativeAccountName',
      list: { $addToSet: '$name' },
      //data: { $push: '$$ROOT' },
    });
    const list = await aggregate.exec();
    return list;
  }

  async getBalanceByAccountTypeCard(query?: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['type'] = 'CARD';
    return this.getBalanceByAccountType(query);
  }
  async getBalanceByAccountTypeWallet(query?: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['type'] = 'WALLET';
    return this.getBalanceByAccountType(query);
  }
  async getBalanceByAccountType(query?: QuerySearchAnyDto) {
    query = query ?? {};
    const aggregate = this.accountModel.aggregate();
    if (query.where) {
      for (const key in query.where) {
        if (isArray(query.where[key])) {
          if (key === '$or') {
            for (const attrOR in query.where[key]) {
              for (const attr in query.where[key][attrOR]) {
                query.where[key][attrOR][attr] = CommonService.checkDateAttr(
                  query.where[key][attrOR][attr],
                );
              }
            }
            continue;
          }
          query.where[key] = {
            $in: query.where[key].map((item) => new ObjectId(item)),
          };
        } else if (isMongoId(query.where[key])) {
          query.where[key] = new ObjectId(query.where[key]);
        } else if (query.where[key]['start'] || query.where[key]['end']) {
          query.where[key] = CommonService.checkDateAttr(query.where[key]);
        }
      }
      aggregate.match(query.where);
    }
    if (query.order) {
      const sort = {};
      for (const order of query.order) {
        sort[order[0]] = order[1];
      }
      aggregate.sort(sort);
    }
    aggregate.group({
      _id: '$type',
      quantity: { $count: {} },
      sum_available: { $sum: '$amount' },
      sum_blocked: { $sum: '$amountBlocked' },
      //data: { $push: '$$ROOT' },
    });
    aggregate.project({
      _id: 0,
      type: '$_id',
      quantity: 1,
      sum_available: 1,
      sum_blocked: 1,
    });
    const list = await aggregate.exec();
    return list;
  }

  async getBalanceByAccountByCard(query?: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['type'] = 'CARD';
    return this.getBalanceByAccount(query);
  }
  async getBalanceByAccountByWallet(query?: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['type'] = 'WALLET';
    return this.getBalanceByAccount(query);
  }
  async getBalanceByAccount(query?: QuerySearchAnyDto) {
    query = query ?? {};
    const aggregate = this.accountModel.aggregate();
    if (!query.where?.type) {
      return Promise.all([
        this.getBalanceByAccount({
          where: {
            type: 'CARD',
          },
        }),
        this.getBalanceByAccount({
          where: {
            type: 'WALLET',
          },
        }),
      ]).then((list) => [
        {
          type: 'CARD',
          balanceByOwner: list[0],
        },
        {
          type: 'WALLET',
          balanceByOwner: list[1],
        },
      ]);
    }
    if (query.where) {
      for (const key in query.where) {
        if (isArray(query.where[key])) {
          if (key === '$or') {
            for (const attrOR in query.where[key]) {
              for (const attr in query.where[key][attrOR]) {
                query.where[key][attrOR][attr] = CommonService.checkDateAttr(
                  query.where[key][attrOR][attr],
                );
              }
            }
            continue;
          }
          query.where[key] = {
            $in: query.where[key].map((item) => new ObjectId(item)),
          };
        } else if (isMongoId(query.where[key])) {
          query.where[key] = new ObjectId(query.where[key]);
        } else if (query.where[key]['start'] || query.where[key]['end']) {
          query.where[key] = CommonService.checkDateAttr(query.where[key]);
        }
      }
      aggregate.match(query.where);
    }
    if (query.order) {
      const sort = {};
      for (const order of query.order) {
        sort[order[0]] = order[1];
      }
      aggregate.sort(sort);
    }
    aggregate.project({
      _id: 0,
      amount: 1,
      email: 1,
      description: 1,
      cardId: '$cardConfig.id',
      userId: '$cardConfig.user_id',
      currency: '$requestBodyJson.amount.local.currency',
    });
    const list = await aggregate.exec();
    return list;
  }
  async getBalanceByOwnerByCard(query?: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['type'] = 'CARD';
    return this.getBalanceByOwner(query);
  }
  async getBalanceByOwnerByWallet(query?: QuerySearchAnyDto) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['type'] = 'WALLET';
    return this.getBalanceByOwner(query);
  }
  async getBalanceByOwner(query?: QuerySearchAnyDto) {
    query = query ?? {};
    const aggregate = this.accountModel.aggregate();
    if (!query.where?.type) {
      return Promise.all([
        this.getBalanceByOwnerByCard(),
        this.getBalanceByOwnerByWallet(),
      ]).then((list) => [
        {
          type: 'CARD',
          balanceByOwner: list[0],
        },
        {
          type: 'WALLET',
          balanceByOwner: list[1],
        },
      ]);
    }
    if (query.where) {
      for (const key in query.where) {
        if (isArray(query.where[key])) {
          if (key === '$or') {
            for (const attrOR in query.where[key]) {
              for (const attr in query.where[key][attrOR]) {
                query.where[key][attrOR][attr] = CommonService.checkDateAttr(
                  query.where[key][attrOR][attr],
                );
              }
            }
            continue;
          }
          query.where[key] = {
            $in: query.where[key].map((item) => new ObjectId(item)),
          };
        } else if (isMongoId(query.where[key])) {
          query.where[key] = new ObjectId(query.where[key]);
        } else if (query.where[key]['start'] || query.where[key]['end']) {
          query.where[key] = CommonService.checkDateAttr(query.where[key]);
        }
      }
      aggregate.match(query.where);
    }
    if (query.order) {
      const sort = {};
      for (const order of query.order) {
        sort[order[0]] = order[1];
      }
      aggregate.sort(sort);
    }
    aggregate.project({
      _id: 0,
      amount: 1,
      owner: 1,
      email: 1,
      description: 1,
      cardId: '$cardConfig.id',
      userId: '$cardConfig.user_id',
    });
    aggregate.group({
      _id: '$owner',
      count: { $count: {} },
      amount: { $sum: '$amount' },
      email: {
        $addToSet: '$email',
      },
      userId: {
        $addToSet: '$userId',
      },
      //data: { $push: '$$ROOT' },
    });
    aggregate.project({
      userId: {
        $first: '$userId',
      },
      email: {
        $first: '$email',
      },
      _id: 0,
      count: 1,
      amount: 1,
    });
    const list = await aggregate.exec();
    return list;
  }
}
