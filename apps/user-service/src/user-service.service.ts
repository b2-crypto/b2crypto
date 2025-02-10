import { AccountInterface } from '@account/account/entities/account.interface';
import { Account } from '@account/account/entities/mongoose/account.schema';
import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CategoryInterface } from '@category/category/entities/category.interface';
import { CommonService } from '@common/common';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { PspAccountInterface } from '@psp-account/psp-account/entities/psp-account.interface';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { UserServiceMongooseService } from '@user/user';
import { UserChangePasswordDto } from '@user/user/dto/user.change-password.dto';
import { UserLevelUpDto } from '@user/user/dto/user.level.up.dto';
import { UserRegisterDto } from '@user/user/dto/user.register.dto';
import { UserUpdateDto } from '@user/user/dto/user.update.dto';
import {
  UserBalanceGenericModel,
  UserBalanceGenericModelData,
  UserBalanceModel,
} from '@user/user/entities/user.balance.model';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesPersonEnum from 'apps/person-service/src/enum/events.names.person.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { isMongoId } from 'class-validator';
import { ObjectId } from 'mongodb';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import EventsNamesUserEnum from './enum/events.names.user.enum';

@Traceable()
@Injectable()
export class UserServiceService {
  private eventClient: ClientProxy;
  constructor(
    @InjectPinoLogger(UserServiceService.name)
    protected readonly logger: PinoLogger,
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
        this.logger.info(`[updateSlugEmail] Updating user ${usr.email}`);
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
            this.logger.info(`[updateSlugEmail] Updating user ${usr.email}`);
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
  async updateBalance(userId?: string) {
    if (isMongoId(userId)) {
      const usr = await this.getOne(userId);
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
          showToOwner: true,
        },
      });
      this.logger.info(`[updateBalance] Balance update ${userId}`);
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
      this.logger.info(
        `[updateBalance] Balance updated ${usr.email} with ${JSON.stringify(
          userBalance,
        )}`,
      );
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
    if (!user.level) {
      const level0 = await this.builder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findAll,
        {
          where: {
            slug: 'grupo-0',
          },
        },
      );
      user.level = level0.list[0];
    }
    const userCreated = await this.lib.create(user);
    if (userCreated.level) {
      this.builder.emitUserEventClient(EventsNamesUserEnum.updateLeveluser, {
        user: userCreated._id,
        level: user.level._id,
      });
    }
    return userCreated;
  }

  async newManyUser(createUsersDto: UserRegisterDto[]) {
    return this.lib.createMany(createUsersDto);
  }

  async applyAndGetRules(user: UserUpdateDto) {
    return this.updateLevelUser(user.level, user.id.toString());
  }

  async updateUser(user: UserUpdateDto) {
    const userUpdated = await this.lib.update(user.id.toString(), user);
    if (user.level) {
      await this.updateLevelUser(
        userUpdated.level.toString(),
        userUpdated._id.toString(),
      );
    }
    return userUpdated;
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

  async levelUp(userLevelUpDto: UserLevelUpDto) {
    const user = await this.getOne(userLevelUpDto.user);
    const currentLevel = await this.getCategoryById(user.level.toString());
    const nextLevel = await this.getCategoryById(userLevelUpDto.level);
    const wallet = await this.getAccountById(userLevelUpDto.wallet);
    // check to pay
    // const physicalCardList = await this.builder.getPromiseAccountEventClient(
    //   EventsNamesAccountEnum.findAll,
    //   {
    //     where: {
    //       type: TypesAccountEnum.CARD,
    //       owner: userLevelUpDto.user,
    //       accountType: CardTypesAccountEnum.PHYSICAL,
    //     },
    //   },
    // );
    // const totalPayment =
    //   physicalCardList.totalElements * currentLevel.valueNumber;
    // const totalToPay =
    //   (physicalCardList.totalElements || 1) * nextLevel.valueNumber;
    //const totalPurchase = totalToPay - totalPayment;
    const totalPurchase = currentLevel.valueNumber;
    // check value to pay
    const leftAmount = wallet.amount * 0.9;
    if (totalPurchase > leftAmount) {
      throw new BadRequestException(
        `The user does not have enough money (${leftAmount}) to level up (${totalPurchase})`,
      );
    }
    user.level = userLevelUpDto.level;
    try {
      // Create tx
      const pspAccount = await this.getPspAccountBySlug(
        CommonService.getSlug('b2fintech'),
      );
      const typeTransaction = await this.getCategoryBySlug(
        CommonService.getSlug('Purchase wallet'),
      );
      const tx = await this.builder.getPromiseTransferEventClient(
        EventsNamesTransferEnum.createOne,
        {
          pspAccount,
          typeTransaction,
          operationType: OperationTransactionType.purchase,
          amount: totalPurchase,
          leadCrmName: 'LEVEL_UP',
          owner: userLevelUpDto.user,
          userAccount: wallet.owner,
          currency: currentLevel.valueText,
          account: wallet._id,
          page: `Old level ${currentLevel.name}`,
          description: `Level up to ${nextLevel.name}`,
          statusPayment: StatusCashierEnum.APPROVED,
          approvedAt: new Date(),
          isApprove: true,
        },
      );
      const rta = user;
      if (user.level !== userLevelUpDto.level) {
        this.logger.info(`[levelUp] Update level all cards to selected level`);
        // rta = await this.updateLevelUser(
        //   userLevelUpDto.level.toString(),
        //   userLevelUpDto.user.toString(),
        // );
      }
      const createOneCardPayload = {
        force: true,
        owner: user._id,
        type: TypesAccountEnum.CARD,
        statusText: StatusAccountEnum.ORDERED,
        accountType: CardTypesAccountEnum.PHYSICAL,
      };
      this.logger.info(
        `[levelUp] Create One Card: ${JSON.stringify(createOneCardPayload)}`,
      );
      this.builder.emitAccountEventClient(
        EventsNamesAccountEnum.createOneCard,
        createOneCardPayload,
      );
      return rta;
    } catch (error) {
      this.logger.error(`[levelUp] ${error.message || error}`);
      throw new BadRequestException(error);
    }
  }

  async verifyUsersWithCard(id: string) {
    const user = await this.getOne(id);
    const promises = [];
    const cardList = await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.findAll,
      {
        take: 1,
        where: {
          type: TypesAccountEnum.CARD,
          owner: id,
        },
      },
    );
    if (cardList.totalElements > 0) {
      const personList = await this.builder.getPromisePersonEventClient(
        EventsNamesPersonEnum.findAll,
        {
          where: {
            user: id,
          },
        },
      );
      if (personList.totalElements > 0) {
        const updateDto = {
          id: personList.list[0]._id,
          user: user._id.toString(),
          verifiedIdentity: true,
        };
        promises.push(
          this.builder
            .getPromisePersonEventClient(
              EventsNamesPersonEnum.updateOne,
              updateDto,
            )
            .then((rta) =>
              this.logger.info(
                `[verifyUsersWithCard] Verified person ${JSON.stringify(rta)}`,
              ),
            )
            .catch((err) =>
              this.logger.error(
                `[verifyUsersWithCard] Error verified person ${
                  err.message || err
                }`,
              ),
            ),
        );
      }
      user.verifyIdentity = true;
      promises.push(
        user.save().then((rta) => {
          this.logger.info(
            `[verifyUsersWithCard] Verified user ${JSON.stringify(rta)}`,
          );
          return {
            id: user._id.toString(),
            verifyIdentity: true,
          };
        }),
      );
    } else {
      promises.push({
        id: user._id.toString(),
        verifyIdentity: user.verifyIdentity,
      });
    }
    return Promise.all(promises).then((rta) => rta[promises.length - 1]);
  }

  async updateLevelUser(levelId: string, userId: string) {
    const customLevels = await this.builder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findAll,
      {
        where: {
          categoryParent: levelId,
          type: TagEnum.CUSTOM_LEVEL,
        },
      },
    );
    const rules = [];
    for (const customLevel of customLevels.list) {
      customLevel.rules = await this.builder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findAll,
        {
          take: 1000,
          where: {
            categoryParent: customLevel.id ?? customLevel._id,
            type: TagEnum.CUSTOM_RULE,
          },
        },
      );
      rules.push({
        name: customLevel.name,
        description: customLevel.description,
        valueNumber: customLevel.valueNumber,
        valueText: customLevel.valueText,
        rules: customLevel.rules.list.map((rule) => {
          return {
            _id: rule._id,
            name: rule.name,
            description: rule.description,
            valueNumber: rule.valueNumber,
            valueText: rule.valueText,
          };
        }),
      });
    }
    const user = await this.lib.update(userId, {
      id: userId,
      level: levelId,
      rules: rules.flat(),
    });
    this.builder.emitAccountEventClient(
      EventsNamesAccountEnum.levelUpCards,
      userId,
    );
    return user;
  }

  private async getCategoryBySlug(slug: string): Promise<CategoryInterface> {
    const categoryList = await this.builder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findAll,
      {
        where: {
          slug,
        },
      },
    );
    const category = categoryList.list[0];
    if (!category) {
      throw new BadRequestException(`Category ${slug} not found`);
    }
    return category;
  }

  private async getPspAccountBySlug(
    slug: string,
  ): Promise<PspAccountInterface> {
    const pspAccountList = await this.builder.getPromisePspAccountEventClient(
      EventsNamesPspAccountEnum.findAll,
      {
        where: {
          slug,
        },
      },
    );
    const pspAccount = pspAccountList.list[0];
    if (!pspAccount) {
      throw new BadRequestException(`Psp account ${slug} not found`);
    }
    return pspAccount;
  }

  private async getCategoryById(categoryId): Promise<CategoryInterface> {
    const category = await this.builder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneById,
      categoryId,
    );
    if (!category) {
      throw new BadRequestException(`Category ${categoryId} not found`);
    }
    return category;
  }

  private async getAccountById(accountId): Promise<AccountInterface> {
    const account = await this.builder.getPromiseAccountEventClient(
      EventsNamesAccountEnum.findOneById,
      accountId,
    );
    if (!account) {
      throw new BadRequestException(`Account ${accountId} not found`);
    }
    return account;
  }

  async download() {
    // TODO[hender] Not implemented download
    return Promise.resolve(undefined);
  }
}
