import { UserChangePasswordDto } from '@user/user/dto/user.change-password.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserUpdateDto } from '@user/user/dto/user.update.dto';
import { UserServiceMongooseService } from '@user/user';
import { Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ObjectId } from 'mongodb';
import { ClientProxy } from '@nestjs/microservices';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import { isMongoId } from 'class-validator';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import {
  UserBalanceGenericModel,
  UserBalanceGenericModelData,
  UserBalanceModel,
} from '@user/user/entities/user.balance.model';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { Account } from '@account/account/entities/mongoose/account.schema';
import TypesAccountEnum from '@account/account/enum/types.account.enum';

@Injectable()
export class UserServiceService {
  private eventClient: ClientProxy;
  constructor(
    @Inject(UserServiceMongooseService)
    private lib: UserServiceMongooseService,
    @Inject(BuildersService)
    private builder: BuildersService,
  ) {
    this.eventClient = builder.getEventClient();
  }

  async updateSlugEmail(id?: string) {
    if (isMongoId(id)) {
      const usr = await this.getOne(id);
      if (!usr._id) {
        throw new NotFoundException('User not found');
      }
      if (!usr.slugEmail) {
        Logger.debug(usr.email, 'slug email');
        return this.updateUser({
          id: usr._id,
          slugEmail: CommonService.getSlug(usr.email),
        });
      }
      return usr;
    } else {
      let users = await this.getAll({});
      const promises = [];
      do {
        for (const usr of users.list) {
          if (!usr.slugEmail) {
            Logger.debug(usr.email, 'slug email');
            promises.push(this.updateSlugEmail(usr._id.toString()));
          }
        }
        users = await this.getAll({
          page: users.nextPage,
        });
      } while (users.nextPage != 1);
      return Promise.all(promises);
    }
  }
  async updateBalance(id?: string) {
    if (isMongoId(id)) {
      const usr = await this.getOne(id);
      if (!usr._id) {
        throw new NotFoundException('User not found');
      }
      const userBalance = {
        wallets: {} as UserBalanceGenericModel,
        cards: {} as UserBalanceGenericModel,
        banks: {} as UserBalanceGenericModel,
        ALL: {
          accountType: 'ALL',
          quantity: 0,
          amount: 0,
          currency: 'USDT',
        } as UserBalanceGenericModelData,
      } as unknown as UserBalanceModel;
      const accounts = await this.builder.getPromiseAccountEventClient<
        ResponsePaginator<Account>
      >(EventsNamesAccountEnum.findAll, {
        take: 999999,
        where: {
          owner: usr._id,
        },
      });
      for (const account of accounts.list) {
        userBalance.ALL.quantity++;
        userBalance.ALL.amount += account.amount;
        if (account.type === TypesAccountEnum.WALLET) {
          userBalance.wallets = this.checkAccountBalance(
            account,
            userBalance.wallets,
          );
          // Swap if currency is different
        } else if (account.type === TypesAccountEnum.CARD) {
          userBalance.cards = this.checkAccountBalance(
            account,
            userBalance.cards,
          );
          // Swap if currency is different
        } else if (account.type === TypesAccountEnum.BANK) {
          userBalance.banks = this.checkAccountBalance(
            account,
            userBalance.banks,
          );
          // Swap if currency is different
        }
      }
      Logger.debug('userBalance', `balance ${usr.email}`);
      return this.updateUser({
        id: usr._id,
        balance: userBalance,
      });
    } else {
      const promises = [];
      let currentPage = 1;
      do {
        const users = await this.getAll({
          page: currentPage,
        });
        Logger.debug(
          `${users.nextPage}`,
          `page ${currentPage}/${users.lastPage}`,
        );
        currentPage = users.nextPage;
        for (const usr of users.list) {
          promises.push(
            this.updateBalance(usr._id.toString()).then(() => usr.email),
          );
        }
      } while (currentPage != 1);
      return Promise.all(promises);
    }
  }

  checkAccountBalance(
    account: Account,
    listAccount?: UserBalanceGenericModel,
    onlyAll = false,
  ) {
    const balance = listAccount['ALL'] ?? {
      accountType: 'ALL',
      quantity: 0,
      amount: 0,
      currency: 'USDT',
    };
    balance.quantity++;
    balance.amount += account.amount;
    if (!onlyAll) {
      const balanceAccountType = listAccount[account.accountType] ?? {
        accountType: account.accountType,
        quantity: 0,
        amount: 0,
        currency: 'USDT',
      };
      balanceAccountType.quantity++;
      balanceAccountType.amount += account.amount;
      listAccount[account.accountType] = balanceAccountType;
    }
    listAccount['ALL'] = balance;
    return listAccount;
  }

  async getOne(id: string) {
    return this.lib.findOne(id);
  }

  async getAll(query: QuerySearchAnyDto) {
    return this.lib.findAll(query);
  }

  async newUser(user: UserRegisterDto) {
    user.slugEmail = CommonService.getSlug(user.email);
    user.username = user.username ?? CommonService.getSlug(user.name);
    user.slugUsername = CommonService.getSlug(user.username);
    user.verifyEmail = true;
    return this.lib.create(user);
  }

  async newManyUser(createUsersDto: UserRegisterDto[]) {
    return this.lib.createMany(createUsersDto);
  }

  async updateUser(user: UserUpdateDto) {
    return this.lib.update(user.id.toString(), user);
  }

  async updateManyUsers(users: UserUpdateDto[]) {
    return this.lib.updateMany(
      users.map((user) => user.id.toString()),
      users,
    );
  }

  async deleteUser(id: string) {
    return this.lib.remove(id);
  }

  async deleteManyUsers(ids: string[]) {
    return this.lib.removeMany(ids);
  }

  async changePasswordUser(id: ObjectId, dataPassword: UserChangePasswordDto) {
    return this.lib.changePassword(id, dataPassword);
  }

  async customUpdateOne(updateRequest: any) {
    const id = updateRequest.id ?? updateRequest._id;
    delete updateRequest.id;
    delete updateRequest._id;
    return this.lib.update(id, updateRequest);
  }

  async download() {
    // TODO[hender] Not implemented download
    return Promise.resolve(undefined);
  }
}
