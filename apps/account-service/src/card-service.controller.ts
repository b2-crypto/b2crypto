import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import { CardDepositCreateDto } from '@account/account/dto/card-deposit.create.dto';
import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { ConfigCardActivateDto } from '@account/account/dto/config.card.activate.dto';
import { PinUpdateDto } from '@account/account/dto/pin.update.dto';
import { AccountEntity } from '@account/account/entities/account.entity';
import { AccountInterface } from '@account/account/entities/account.interface';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { Card } from '@account/account/entities/mongoose/card.schema';
import { UserCard } from '@account/account/entities/mongoose/user-card.schema';
import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { BuildersService } from '@builder/builders';
import { CategoryInterface } from '@category/category/entities/category.interface';
import { CommonService } from '@common/common';
import { NoCache } from '@common/common/decorators/no-cache.decorator';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import { CardsEnum } from '@common/common/enums/messages.enum';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { IntegrationService } from '@integration/integration';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { UserCardDto } from '@integration/integration/card/generic/dto/user.card.dto';
import { IntegrationCardService } from '@integration/integration/card/generic/integration.card.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  NotFoundException,
  NotImplementedException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import {
  ApiBearerAuth,
  ApiExcludeEndpoint,
  ApiHeader,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { OutboxServiceMongooseService } from '@outbox/outbox';
import { OutboxCreateDto } from '@outbox/outbox/dto/outbox.create.dto';
import { AddressSchema } from '@person/person/entities/mongoose/address.schema';
import { PspAccountInterface } from '@psp-account/psp-account/entities/psp-account.interface';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { FiatIntegrationClient } from 'apps/integration-service/src/clients/fiat.integration.client';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { Cache } from 'cache-manager';
import { isEmpty, isNumber, isString } from 'class-validator';
import * as crypto from 'crypto';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import mongoose from 'mongoose';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import * as pug from 'pug';
import { ResponsePaginator } from '../../../libs/common/src/interfaces/response-pagination.interface';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { AfgNamesEnum } from './enum/afg.names.enum';
import EventsNamesAccountEnum from './enum/events.names.account.enum';

@ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
@Traceable()
@Controller('cards')
export class CardServiceController extends AccountServiceController {
  constructor(
    @InjectPinoLogger(CardServiceController.name)
    protected readonly logger: PinoLogger,
    readonly cardService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(CategoryServiceService)
    private readonly categoryService: CategoryServiceService,
    @Inject(StatusServiceService)
    private readonly statusService: StatusServiceService,
    @Inject(GroupServiceService)
    private readonly groupService: GroupServiceService,
    @Inject(BuildersService)
    readonly cardBuilder: BuildersService,
    private readonly integration: IntegrationService,
    private readonly configService: ConfigService,
    private readonly currencyConversion: FiatIntegrationClient,
    @Inject(OutboxServiceMongooseService)
    private readonly outboxService: OutboxServiceMongooseService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    super(logger, cardService, cardBuilder);
  }

  private readonly BLOCK_BALANCE_PERCENTAGE: number =
    this.configService.get<number>('AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE');

  @Patch('pin')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  async updateOnePin(@Body() pinUpdateDto: PinUpdateDto, @Req() req?: any) {
    const userId = CommonService.getUserId(req);
    if (isNumber(parseInt(pinUpdateDto.pin)) && pinUpdateDto.id) {
      if (pinUpdateDto.pin.toString().length != 4) {
        throw new BadRequestException('PIN must be 4 digits');
      }
      const pin = CommonService.getNumberDigits(parseInt(pinUpdateDto.pin), 4);
      const card = await this.findOneById(pinUpdateDto.id);
      /*if(card.pin != pinUpdateDto.oldPin) {
        throw new BadRequestException('PIN not updated');
      }*/
      if (card.cardConfig) {
        const cardIntegration = await this.integration.getCardIntegration(
          IntegrationCardEnum.POMELO,
        );
        if (!cardIntegration) {
          throw new BadRequestException('Bad integration card');
        }
        const user = await this.cardBuilder.getPromiseUserEventClient(
          EventsNamesUserEnum.findOneById,
          userId,
        );
        try {
          if (!user.userCard) {
            user.userCard = await this.getUserCard(cardIntegration, user);
          }
          const cardUpdate = await cardIntegration.updateCard({
            id: card.cardConfig.id,
            pin,
          });
          if (cardUpdate['error']) {
            throw new BadRequestException('PIN not updated');
          }
        } catch (err) {
          if (err.response?.data) {
            this.logger.error(
              `[updateOnePin] Error HTTP request ${JSON.stringify(
                err.response?.data,
              )}`,
            );
            if (err.response?.data?.error?.details) {
              throw new BadRequestException(
                err.response?.data?.error?.details
                  ?.map((e) => e.detail)
                  .join(', '),
              );
            }
          } else {
            this.logger.error(
              `[updateOnePin] Error in card profile or update card ${err}`,
            );
          }
          throw new BadRequestException('Card not updated');
        }
      }
      return this.updateOne({
        id: pinUpdateDto.id,
        pin: pin,
      });
    }
    throw new BadRequestException('Not found id or numeric PIN to update');
  }

  @ApiExcludeEndpoint()
  @Get('all')
  @NoCache()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  async findAll(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    return this.cardService.findAll(query);
  }

  private async swapToCurrencyUser(req: any, account: AccountEntity) {
    req.user.currency = req.user.currency ?? CurrencyCodeB2cryptoEnum.USD;
    if (
      (account.amount === 0 && account.amountCustodial === 0) ||
      req.user.currency === account.currencyCustodial
    ) {
      return account.amount || account.amountCustodial;
    }
    try {
      const amount = await this.currencyConversion.getCurrencyConversion(
        req.user.currency,
        account.currencyCustodial,
        account.amountCustodial || account.amount,
      );
      this.cardBuilder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
        id: req.user.id,
        amount: amount,
        currency: req.user.currency,
      });
      return amount;
    } catch (err) {
      this.logger.error(`[swapToCurrencyUser] CardController ${err}`);
      return account.amountCustodial || account.amount;
    }
  }

  @Get('me')
  @NoCache()
  @ApiBearerAuth('bearerToken')
  async findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    query.where.showToOwner = query.where?.showToOwner ?? true;
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    const rta = await this.cardService.findAll(query);
    rta.list.forEach(async (account) => {
      account.amount = await this.swapToCurrencyUser(req, account);
      account.currency = req.user.currency ?? CurrencyCodeB2cryptoEnum.USDT;
    });
    return rta;
  }

  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @Post('create')
  @UseGuards(ApiKeyAuthGuard)
  async createOne(@Body() createDto: CardCreateDto, @Req() req?: any) {
    const userId = createDto.owner || req?.user?.id;
    const user: User = await this.getUser(userId);
    createDto.accountType =
      createDto.accountType ?? CardTypesAccountEnum.VIRTUAL;
    if (!createDto.force) {
      //await this.validateRuleLimitCards(user, createDto.accountType);
    }
    if (createDto.accountType == CardTypesAccountEnum.PHYSICAL) {
      const physicalCards = await this.findAll({
        take: 1,
        where: {
          owner: userId,
          statusText: StatusAccountEnum.ORDERED,
        },
      });
      if (physicalCards.totalElements > 0) {
        throw new BadRequestException('Already physical card ordered');
      }
      createDto.statusText = StatusAccountEnum.ORDERED;
    }
    //let level = await this.getCategoryById(user.level?.toString());
    let level = await this.cardBuilder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      {
        slug: 'grupo-1',
      },
    );
    const cardAfg = this.getAfgByLevel(
      level.slug,
      createDto.accountType === CardTypesAccountEnum.PHYSICAL,
    );

    this.logger.info(`[createOne] cardAfg: ${JSON.stringify(cardAfg)}`);

    let price = 0;
    if (!cardAfg || cardAfg === AfgNamesEnum.NA) {
      level = await this.cardBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'grupo-1',
        },
      );
      if (!level) {
        throw new BadRequestException('Not found level 1');
      }
      // TODO Pasar la persona a nivel 1
      // this.logger.info(
      //   `${cardAfg} - ${level.slug}`,
      //   `'AFG not found for CARD-${createDto.accountType}`,
      // );
      // throw new NotFoundException('Level AFG not found');
    }
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    // const virtualCardPending = await this.cardService.findAll({
    //   where: {
    //     owner: user._id,
    //     accountType: CardTypesAccountEnum.VIRTUAL,
    //   },
    // });
    // TODO[hender - 2024/08/12] Limit virtual card
    // if (virtualCardPending.totalElements === 10) {
    //   throw new BadRequestException('Already have 10 cards');
    // }
    let cardGroupName = level.slug;
    if (createDto.accountType === CardTypesAccountEnum.VIRTUAL) {
      cardGroupName = 'virtuales-' + level.slug;
    } else {
      cardGroupName = 'fisicas-' + level.slug;
    }
    const levelCardGroup = await this.cardBuilder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      {
        slug: `/${cardGroupName}/ig`,
      },
    );

    this.logger.info(
      `[createOne] levelCardGroup: ${JSON.stringify(levelCardGroup)}`,
    );

    const cardGroupPrice = await this.cardBuilder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      {
        categoryParent: levelCardGroup._id,
        slug: 'precio-card-extra',
      },
    );

    this.logger.info(
      `[createOne] cardGroupPrice: ${JSON.stringify(cardGroupPrice)}`,
    );

    price = cardGroupPrice.valueNumber;
    createDto.owner = user._id;
    if (createDto.pin && createDto.pin?.toString().length != 4) {
      throw new BadRequestException('The PIN must be 4 digits');
    }
    createDto.pin =
      createDto.pin ??
      CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
    createDto.email = user.email ?? user.personalData.email[0];

    this.logger.info(`[createOne] createDto: ${JSON.stringify(createDto)}`);

    const account = await this.cardService.createOne(createDto);

    this.logger.info(`[createOne] account: ${JSON.stringify(account)}`);

    let tx = null;
    if (price > 0) {
      try {
        tx = await this.txPurchaseCard(
          createDto.fromAccountId,
          price,
          user,
          `PURCHASE_${createDto.type}_${createDto.accountType}`,
          null,
          `Compra de ${createDto.type} ${createDto.accountType} ${level.name}`,
        );
      } catch (err) {
        await this.getAccountService().deleteOneById(account._id);
        throw err;
      }
    }

    this.logger.info(`[createOne] tx: ${JSON.stringify(tx)}`);

    try {
      const cardIntegration = await this.integration.getCardIntegration(
        IntegrationCardEnum.POMELO,
        account,
      );
      if (!cardIntegration) {
        throw new BadRequestException('Bad integration card');
      }

      this.logger.info(
        `[createOne] cardIntegration: ${JSON.stringify(cardIntegration)}`,
      );

      // Validate User Card
      if (!user.userCard) {
        account.userCardConfig = await this.getUserCard(
          cardIntegration,
          user,
          account,
        );
      } else {
        account.userCardConfig = user.userCard;
      }
      account.email =
        user.email ?? account.email ?? user.personalData?.email[0];
      // Validate Affinity Group
      if (!account?.group?.valueGroup) {
        /* const affinityGroup = await cardIntegration.getAffinityGroup(
          account.userCardConfig,
        );
        const afg = affinityGroup.data[0]; */
        // TODO[hender - 2024/06/05]
        const group = await this.buildAFG(null, cardAfg);

        this.logger.info(`[createOne] group: ${JSON.stringify(group)}`);

        account.group = group.list[0];
      }
      // Create Card
      const address = {
        street_name:
          createDto?.address?.street_name ??
          user.personalData?.location?.address?.street_name,
        street_number: ' ',
        apartment:
          createDto?.address?.apartment ??
          user.personalData?.location?.address?.apartment,
        city:
          createDto?.address?.city ?? user.personalData.location.address.city,
        region:
          createDto?.address?.region ??
          user.personalData?.location?.address?.region,
        country: 'COL',
        /* country: countries.filter(
          (c) => c.alpha2 === user.personalData.nationality,
        )[0].alpha3, */
        neighborhood:
          createDto?.address?.neighborhood ??
          user.personalData?.location?.address?.neighborhood,
      };

      this.logger.info(`[createOne] address: ${JSON.stringify(address)}`);

      const cardDataIntegration = {
        user_id: account.userCardConfig.id,
        affinity_group_id: account.group.valueGroup,
        card_type: account.accountType,
        address: address,
        previous_card_id: null,
      };

      this.logger.info(
        `[createOne] cardDataIntegration: ${JSON.stringify(
          cardDataIntegration,
        )}`,
      );
      // if (createDto.prevAccount) {
      //   const prevCard = await this.cardService.findOneById(
      //     createDto.prevAccount.toString(),
      //   );
      //   if (!prevCard || !prevCard.cardConfig) {
      //     throw new BadRequestException('Prev account not found');
      //   }
      //   cardDataIntegration.previous_card_id = prevCard.cardConfig.id;
      // }
      const card = await cardIntegration.createCard(cardDataIntegration);

      this.logger.info(`[createOne] card: ${JSON.stringify(card)}`);

      const error = card['error'];
      if (error) {
        // TODO[hender - 2024-08-12] If problems with data user in Pomelo, flag to update in pomelo when update profile user
        throw new BadRequestException(error);
      }
      account.cardConfig = card.data as unknown as Card;
      if (card.data['shipment_id']) {
        const dataShipping = await cardIntegration.getShippingPhysicalCard(
          card.data['shipment_id'],
        );
        account.responseShipping = dataShipping.data;
        if (
          dataShipping.data.status === StatusAccountEnum.REJECTED ||
          dataShipping.data.status === StatusAccountEnum.DESTRUCTION
        ) {
          account.statusText = StatusAccountEnum.CANCEL;
        }
      }
      account.save();

      const walletDTO = {
        owner: account.owner,
        name: 'USD Tether (Tron)',
        type: TypesAccountEnum.WALLET,
        accountType: WalletTypesAccountEnum.VAULT,
      };

      this.logger.info(`[createOne] walletDTO: ${JSON.stringify(walletDTO)}`);

      const countWalletsUser =
        await this.cardBuilder.getPromiseAccountEventClient(
          EventsNamesAccountEnum.count,
          {
            take: 1,
            where: walletDTO,
          },
        );

      this.logger.info(
        `[createOne] countWalletsUser: ${JSON.stringify(countWalletsUser)}`,
      );

      if (countWalletsUser < 1) {
        this.cardBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.createOneWallet,
          walletDTO,
        );
      }

      this.logger.info(`[createOne] account: ${JSON.stringify(account)}`);

      return account;
    } catch (err) {
      await this.getAccountService().deleteOneById(account._id);
      if (price > 0) {
        await this.txPurchaseCard(
          createDto.fromAccountId,
          price,
          user,
          `REVERSAL_PURCHASE_${createDto.type}_${createDto.accountType}`,
          null,
          `Compra de ${createDto.type} ${createDto.accountType} ${level.name}`,
          `Reversal`,
          true,
        );
      }
      this.logger.error(
        `[createOne] Account Card not created ${account.owner} ${err}`,
      );
      if (err.response) {
        err.response.details = err.response.details ?? [];
        err.response.details.push({
          detail: 'Card not created',
        });
        const desc = err.response.details.reduce(
          (prev, current) => (current.detail += ', ' + prev.detail),
        );
        throw new BadRequestException({
          statusCode: 400,
          description: desc,
        });
      } else {
        throw new BadRequestException({
          statusCode: 400,
          description: err,
        });
      }
    }
  }

  private async txPurchaseCard(
    fromAccountId: string,
    totalPurchase: number,
    owner: User,
    type: string,
    account: AccountInterface,
    description?: string,
    page?: string,
    reversal = false,
  ) {
    const pspAccount = await this.getPspAccountBySlug(
      CommonService.getSlug('b2fintech'),
    );
    const typeTransaction = await this.getCategoryBySlug(
      reversal
        ? CommonService.getSlug('Reversal purchase')
        : CommonService.getSlug('Purchase wallet'),
    );

    if (!account) {
      const accountQuery = {
        where: {
          type: 'WALLET',
          owner: owner._id,
          _id: fromAccountId,
        },
      };

      const listAccount = await this.cardBuilder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.findAll,
        accountQuery,
      );

      if (!listAccount.totalElements) {
        throw new BadRequestException('Need wallet to pay');
      }

      account = listAccount.list[0];
    }

    if (totalPurchase > account.amount * 0.9) {
      throw new BadRequestException('Wallet with not enough balance');
    }

    return this.cardBuilder.getPromiseTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        pspAccount,
        typeTransaction,
        operationType: reversal
          ? OperationTransactionType.reversal_purchase
          : OperationTransactionType.purchase,
        amount: totalPurchase,
        leadCrmName: type,
        owner: owner._id,
        userAccount: account.owner,
        currency: 'USDT',
        account: account._id,
        page,
        description,
        statusPayment: StatusCashierEnum.APPROVED,
        approvedAt: new Date(),
        isApprove: true,
      },
    );
  }

  private async getCategoryBySlug(slug: string): Promise<CategoryInterface> {
    const categoryList = await this.cardBuilder.getPromiseCategoryEventClient(
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
    const pspAccountList =
      await this.cardBuilder.getPromisePspAccountEventClient(
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

  private async validateRuleLimitCards(
    user: User,
    cardType: CardTypesAccountEnum,
  ) {
    let cardTypeName = CommonService.getSlug(cardType);
    if (cardTypeName === 'physical') {
      cardTypeName = 'fisica';
    }
    const configLimitCards = user.rules.filter(
      (variant) =>
        CommonService.getSlug(variant.name).indexOf(cardTypeName) !== -1,
    )[0];
    if (!configLimitCards) {
      throw new BadRequestException('Not found rule for type cards');
    }
    const ruleLimitCards = configLimitCards.rules.filter(
      (variant) =>
        CommonService.getSlug(variant.name).indexOf('limite-de-tarjetas') !==
        -1,
    )[0];
    if (!ruleLimitCards) {
      throw new BadRequestException('Not found rule limits cards');
    }
    const limitCards = ruleLimitCards.valueNumber;
    const cardList = await this.cardService.findAll({
      take: 1,
      where: {
        owner: user._id,
        showToOwner: true,
        accountType: cardType,
        statusText: [StatusAccountEnum.UNLOCK, StatusAccountEnum.LOCK],
      },
    });
    if (cardList.totalElements + 1 > limitCards) {
      throw new BadRequestException(
        `You have (${cardList.totalElements}) reached the limit (${limitCards}) of cards`,
      );
    }
  }

  private async getCategoryByType(type: string) {
    const category = await this.cardBuilder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneByNameType,
      {
        take: 1000,
        where: {
          type,
        },
      },
    );
    if (!category.totalElements) {
      throw new BadRequestException('Empty list');
    }
    return category;
  }

  private async getCategoryById(categoryId: string) {
    const category = await this.cardBuilder.getPromiseCategoryEventClient(
      EventsNamesCategoryEnum.findOneById,
      categoryId,
    );
    if (!category) {
      throw new BadRequestException('Not found');
    }
    return category;
  }

  private getAfgByLevel(levelSlug: string, cardPhysical = false): AfgNamesEnum {
    const map = cardPhysical
      ? {
          'grupo-0': AfgNamesEnum.NA,
          'grupo-1': AfgNamesEnum.CONSUMER_NOMINADA_3K,
          'grupo-2': AfgNamesEnum.CONSUMER_NOMINADA_10K,
          'grupo-3': AfgNamesEnum.CONSUMER_INNOMINADA_25K,
          'grupo-4': AfgNamesEnum.CONSUMER_INNOMINADA_100K,
        }
      : {
          'grupo-0': AfgNamesEnum.CONSUMER_VIRTUAL_1K,
          'grupo-1': AfgNamesEnum.CONSUMER_VIRTUAL_1K,
          'grupo-2': AfgNamesEnum.CONSUMER_VIRTUAL_2K,
          'grupo-3': AfgNamesEnum.CONSUMER_VIRTUAL_5K,
          'grupo-4': AfgNamesEnum.CONSUMER_VIRTUAL_10K,
        };

    return (
      map[levelSlug] ??
      (() => {
        throw new BadRequestException(`Wrong level ${levelSlug}`);
      })()
    );
  }

  private getAfgProd(cardAfg: AfgNamesEnum) {
    let afg = {
      id: 'afg-2lZYP9KVezJJcvSKCkAMbNPOolq',
      name: 'Consumer-Virtual-1k',
      card_type_supported: ['VIRTUAL'],
      innominate: false,
      months_to_expiration: 96,
      issued_account: 9,
      fee_account: 36,
      exchange_rate_type: 'none',
      exchange_rate_amount: 0,
      non_usd_exchange_rate_amount: 0,
      dcc_exchange_rate_amount: 0,
      local_withdrawal_allowed: true,
      international_withdrawal_allowed: true,
      local_ecommerce_allowed: true,
      international_ecommerce_allowed: true,
      local_purchases_allowed: true,
      international_purchases_allowed: true,
      product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
      local_extracash_allowed: true,
      international_extracash_allowed: true,
      plastic_model: 1,
      kit_model: 1,
      status: 'ACTIVE',
      embossing_company: 'IDEMIA',
      courier_company: 'DOMINA',
      exchange_currency_name: 'COP',
      activation_code_enabled: false,
      total_exchange_rate: 4149.79,
      total_non_usd_exchange_rate: 4149.79,
      total_dcc_exchange_rate: 4149.79,
      provider: 'MASTERCARD',
      custom_name_on_card_enabled: false,
      provider_algorithm: 'MCHIP',
      start_date: '2024-09-03',
      dcvv_enabled: false,
    };
    switch (cardAfg) {
      // PHYSICAL
      case AfgNamesEnum.CONSUMER_NOMINADA_3K:
        afg = {
          id: 'afg-2lZUsLQBqiS9izPyZfm9WW7gJUr',
          name: 'Consumer-Nominada-3k',
          card_type_supported: ['PHYSICAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_NOMINADA_10K:
        afg = {
          id: 'afg-2lZXPZEUyjw5BtJGpPw566eYvtx',
          name: 'Consumer-Nominada-10k',
          card_type_supported: ['PHYSICAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_NOMINADA_25K:
        afg = {
          id: 'afg-2lZXXQoTu1rZqIefYA0gMrmjksA',
          name: 'Consumer-Nominada-25k',
          card_type_supported: ['PHYSICAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: '100',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'BLOCKED',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_NOMINADA_100K:
        afg = {
          id: 'afg-2lZXdcYBx3twdM3QRIY4UzSDKRs',
          name: 'Consumer-Nominada-100k',
          card_type_supported: ['PHYSICAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: '100',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'BLOCKED',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_INNOMINADA_25K:
        afg = {
          id: 'afg-2lZYCpM3SS1Bn6mDP4VLPgOaHXo',
          name: 'Consumer-Innominada-25k',
          card_type_supported: ['PHYSICAL'],
          innominate: true,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_INNOMINADA_100K:
        afg = {
          id: 'afg-2lZYHlB3qAN9LnPKMV395flMUlp',
          name: 'Consumer-Innominada-100k',
          card_type_supported: ['PHYSICAL'],
          innominate: true,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      // VIRTUAL
      case AfgNamesEnum.CONSUMER_VIRTUAL_1K:
        afg = {
          id: 'afg-2lZYP9KVezJJcvSKCkAMbNPOolq',
          name: 'Consumer-Virtual-1k',
          card_type_supported: ['VIRTUAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_VIRTUAL_2K:
        afg = {
          id: 'afg-2lZYTHIOaWFW1uB8kg79vuhuWuS',
          name: 'Consumer-Virtual-2k',
          card_type_supported: ['VIRTUAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_VIRTUAL_5K:
        afg = {
          id: 'afg-2lZhmFyzsHojufE42Tfn1X73mnG',
          name: 'Consumer-Virtual-5k',
          card_type_supported: ['VIRTUAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'THALES',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_VIRTUAL_10K:
        afg = {
          id: 'afg-2lZYZ7oGxBT1FhsSnBvywgVrCQq',
          name: 'Consumer-Virtual-10k',
          card_type_supported: ['VIRTUAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4149.79,
          total_non_usd_exchange_rate: 4149.79,
          total_dcc_exchange_rate: 4149.79,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-09-03',
          dcvv_enabled: false,
        };
        break;
      default:
        throw new BadRequestException('Card AFG not found');
    }
    return afg;
  }

  private getAfgStage(cardAfg: AfgNamesEnum) {
    let afg = {
      id: 'afg-2VtGPHue8VIrXsJa0H7OzLLri4T',
      name: 'Afinidad basica 2',
      card_type_supported: ['VIRTUAL', 'PHYSICAL'],
      innominate: false,
      months_to_expiration: 96,
      issued_account: 9,
      fee_account: 36,
      exchange_rate_type: 'none',
      exchange_rate_amount: 0,
      non_usd_exchange_rate_amount: 0,
      dcc_exchange_rate_amount: 0,
      local_withdrawal_allowed: false,
      international_withdrawal_allowed: false,
      local_ecommerce_allowed: true,
      international_ecommerce_allowed: true,
      local_purchases_allowed: true,
      international_purchases_allowed: true,
      product_id: 'prd-2VtGP4RvXv5enzWYe2jikrxucrG',
      local_extracash_allowed: true,
      international_extracash_allowed: true,
      plastic_model: 1,
      kit_model: 1,
      status: 'ACTIVE',
      embossing_company: 'THALES',
      courier_company: 'ESTAFETA',
      exchange_currency_name: 'MXN',
      activation_code_enabled: false,
      total_exchange_rate: 20.6,
      total_non_usd_exchange_rate: 20.6,
      total_dcc_exchange_rate: 20.6,
      provider: 'MASTERCARD',
      custom_name_on_card_enabled: false,
      provider_algorithm: 'EMV_CSKD',
      start_date: '2023-09-25',
      dcvv_enabled: false,
    };
    switch (cardAfg) {
      case AfgNamesEnum.CONSUMER_NOMINADA_3K:
      case AfgNamesEnum.CONSUMER_NOMINADA_10K:
      case AfgNamesEnum.CONSUMER_NOMINADA_25K:
      case AfgNamesEnum.CONSUMER_NOMINADA_100K:
        afg = {
          id: 'afg-2fdxV2deQc0qHDbTtCwOlbFZJBL',
          name: 'B2Crypto COL physical credit nominated',
          card_type_supported: ['PHYSICAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: '100',
          exchange_rate_amount: 100,
          non_usd_exchange_rate_amount: 100,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2fdxUv6l6VEVxlgOxt2UGCCUZXs',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4169.8,
          total_non_usd_exchange_rate: 4169.8,
          total_dcc_exchange_rate: 4128.51,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-04-26',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_INNOMINADA_25K:
      case AfgNamesEnum.CONSUMER_INNOMINADA_100K:
        afg = {
          id: 'afg-2jc1143Egwfm4SUOaAwBz9IfZKb',
          name: 'B2Crypto innominated',
          card_type_supported: ['PHYSICAL'],
          innominate: true,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2arLJXW8moDb5CppLToizmmw66q',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4128.51,
          total_non_usd_exchange_rate: 4128.51,
          total_dcc_exchange_rate: 4128.51,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-07-22',
          dcvv_enabled: false,
        };
        break;
      case AfgNamesEnum.CONSUMER_VIRTUAL_1K:
      case AfgNamesEnum.CONSUMER_VIRTUAL_2K:
      case AfgNamesEnum.CONSUMER_VIRTUAL_5K:
      case AfgNamesEnum.CONSUMER_VIRTUAL_10K:
        afg = {
          id: 'afg-2jhjNvaMmNsNHzbx54nWv12j9MQ',
          name: 'B2Crypto Virtual',
          card_type_supported: ['VIRTUAL'],
          innominate: false,
          months_to_expiration: 96,
          issued_account: 9,
          fee_account: 36,
          exchange_rate_type: 'none',
          exchange_rate_amount: 0,
          non_usd_exchange_rate_amount: 0,
          dcc_exchange_rate_amount: 0,
          local_withdrawal_allowed: true,
          international_withdrawal_allowed: true,
          local_ecommerce_allowed: true,
          international_ecommerce_allowed: true,
          local_purchases_allowed: true,
          international_purchases_allowed: true,
          product_id: 'prd-2arLJXW8moDb5CppLToizmmw66q',
          local_extracash_allowed: true,
          international_extracash_allowed: true,
          plastic_model: 1,
          kit_model: 1,
          status: 'ACTIVE',
          embossing_company: 'IDEMIA',
          courier_company: 'DOMINA',
          exchange_currency_name: 'COP',
          activation_code_enabled: false,
          total_exchange_rate: 4128.51,
          total_non_usd_exchange_rate: 4128.51,
          total_dcc_exchange_rate: 4128.51,
          provider: 'MASTERCARD',
          custom_name_on_card_enabled: false,
          provider_algorithm: 'MCHIP',
          start_date: '2024-07-24',
          dcvv_enabled: false,
        };
        break;
    }
    return afg;
  }

  private async buildAFG(
    afgId?: string,
    cardAfg: AfgNamesEnum = AfgNamesEnum.CONSUMER_VIRTUAL_1K,
  ) {
    let afg =
      process.env.ENVIRONMENT === 'PROD'
        ? this.getAfgProd(cardAfg)
        : this.getAfgStage(cardAfg);
    this.logger.info(`[buildAFG] ${JSON.stringify(afg)}`);
    // TODO[hender-20/08/2024] check the level user (individual/corporate)
    if (afgId) {
      afg = {
        id: afgId ?? 'afg-2arMn990ZksFKAHS5PngRPHqRmS',
        name: afgId
          ? 'migration'
          : 'B2Crypto COL physical virtual credit nominated',
        card_type_supported: ['VIRTUAL'],
        innominate: false,
        months_to_expiration: 84,
        issued_account: 9,
        fee_account: 36,
        exchange_rate_type: 'none',
        exchange_rate_amount: 100,
        non_usd_exchange_rate_amount: 100,
        dcc_exchange_rate_amount: 0,
        local_withdrawal_allowed: true,
        international_withdrawal_allowed: true,
        local_ecommerce_allowed: true,
        international_ecommerce_allowed: true,
        local_purchases_allowed: true,
        international_purchases_allowed: true,
        product_id: 'prd-2arLJXW8moDb5CppLToizmmw66q',
        local_extracash_allowed: true,
        international_extracash_allowed: true,
        plastic_model: 1,
        kit_model: 1,
        status: 'ACTIVE',
        embossing_company: 'THALES',
        courier_company: 'DOMINA',
        exchange_currency_name: 'COP',
        activation_code_enabled: false,
        total_exchange_rate: 4169.8,
        total_non_usd_exchange_rate: 4169.8,
        total_dcc_exchange_rate: 4128.51,
        provider: 'MASTERCARD',
        custom_name_on_card_enabled: false,
        provider_algorithm: 'MCHIP',
        start_date: '2024-01-12',
        dcvv_enabled: true,
      };
    }
    const group = await this.groupService.getAll({
      where: {
        slug: CommonService.getSlug(afg.name),
      },
    });
    if (group.totalElements < 1) {
      const categoryAffinityGroupList = await this.categoryService.getAll({
        where: {
          slug: 'affinity-group',
        },
      });
      if (categoryAffinityGroupList.totalElements < 1) {
        categoryAffinityGroupList.list.push(
          await this.categoryService.newCategory({
            name: 'Affinity Group',
            description: 'Affinity Group to Cards',
            type: TagEnum.CATEGORY,
            resources: [ResourcesEnum.GROUP],
          }),
        );
      }
      const categoryAffinityGroup = categoryAffinityGroupList.list[0];
      const statusActive = await this.statusService.getAll({
        where: {
          slug: 'active',
        },
      });
      if (!statusActive.totalElements) {
        throw new BadRequestException('Status active not found');
      }
      // Create Affinity Group
      group.list.push(
        await this.groupService.newGroup({
          name: afg.name,
          valueGroup: afg.id,
          status: statusActive.list[0]?._id,
          category: categoryAffinityGroup._id,
        }),
      );
    }
    return group;
  }

  @ApiExcludeEndpoint()
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  @Get('shipping/:idCard')
  @NoCache()
  async getShippingPhysicalCard(
    @Param('idCard') idCard: string,
    @Req() req?: any,
  ) {
    const user: User = await this.getUser(req?.user?.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    const card = await this.cardService.findOneById(idCard);
    if (!card) {
      throw new BadRequestException('Card has not found');
    }
    if (!card.responseShipping) {
      throw new BadRequestException('Card has not shipping');
    }
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );
    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }
    //TODO[hender-2024/07/25] Certification Pomelo
    const rtaGetShipping = await cardIntegration.getShippingPhysicalCard(
      card.responseShipping.id,
    );
    this.logger.info(`[getShippingPhysicalCard] Shipping ${rtaGetShipping}`);
    return card.responseShipping;
  }

  @ApiExcludeEndpoint()
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  @Post('shipping')
  async shippingPhysicalCard(@Req() req?: any) {
    // const user: User = await this.getUser(req?.user?.id);
    // if (!user) {
    //   throw new NotFoundException('User not found');
    // }
    // if (!user.personalData) {
    //   throw new BadRequestException('Profile of user not found');
    // }
    // if (!user.personalData.location?.address) {
    //   throw new BadRequestException('Location address not found');
    // }
    // const physicalCardPending = await this.cardService.findAll({
    //   where: {
    //     owner: user._id,
    //     responseShiping: {
    //       $exists: true,
    //     },
    //     cardConfig: {
    //       $exists: false,
    //     },
    //   },
    // });
    // if (physicalCardPending.totalElements > 0) {
    //   throw new BadRequestException('Already physical card pending');
    // }
    // const cardIntegration = await this.integration.getCardIntegration(
    //   IntegrationCardEnum.POMELO,
    // );
    // if (!cardIntegration) {
    //   throw new BadRequestException('Bad integration card');
    // }
    // if (!user.userCard) {
    //   user.userCard = await this.getUserCard(cardIntegration, user);
    // }
    // const rtaShippingCard = await cardIntegration.shippingPhysicalCard({
    //   shipment_type: 'CARD_FROM_WAREHOUSE',
    //   // TODo[hender-2024/08/02] Default because is available AFG
    //   affinity_group_id: 'afg-2jc1143Egwfm4SUOaAwBz9IfZKb',
    //   // TODo[hender-2024/08/02] Default because only COL is authorized
    //   country: 'COL',
    //   user_id: user.userCard.id,
    //   address: {
    //     street_name: user.personalData.location.address.street_name,
    //     street_number: ' ',
    //     city: user.personalData.location.address.city,
    //     region: user.personalData.location.address.region,
    //     country: user.personalData.location.address.country,
    //     neighborhood: user.personalData.location.address.neighborhood,
    //     apartment: user.personalData.location.address.apartment,
    //   },
    //   receiver: {
    //     full_name: user.personalData.name,
    //     email: user.email,
    //     document_type: user.personalData.typeDocId,
    //     document_number: user.personalData.numDocId,
    //     telephone_number:
    //       user.personalData.telephones[0]?.phoneNumber ??
    //       user.personalData.phoneNumber,
    //   },
    // });

    // if (rtaShippingCard.data.id) {
    //   const account = await this.cardService.createOne({
    //     type: TypesAccountEnum.CARD,
    //     accountType: CardTypesAccountEnum.PHYSICAL,
    //     responseShipping: rtaShippingCard.data,
    //     address: rtaShippingCard.data.address as any,
    //     personalData: user.personalData,
    //     owner: user._id ?? user.id,
    //   } as AccountCreateDto);
    //   return account;
    // }
    // throw new BadRequestException('Shipment was not created');
    throw new NotImplementedException();
  }

  private createHash(key: string) {
    return crypto.createHash('sha256').update(key).digest('hex');
  }

  //@ApiExcludeEndpoint()
  @Post('recharge')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async rechargeOne(@Body() createDto: CardDepositCreateDto, @Req() req?: any) {
    const hashTx = this.createHash(
      JSON.stringify({
        from: createDto.from,
        to: createDto.to,
        amount: createDto.amount,
      }),
    );
    const data = await this.cacheManager.get(hashTx);
    this.logger.info(
      `[rechargeOne] hash: ${hashTx} - inCache: ${JSON.stringify(
        data,
      )} - data: ${JSON.stringify(createDto)}`,
    );
    if (data) {
      throw new BadRequestException('Transaction already processed');
    }
    await this.cacheManager.set(hashTx, createDto, 1 * 60 * 1000);

    const user: User = await this.getUser(req?.user?.id);
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    if (createDto.amount < 10) {
      throw new BadRequestException('The recharge not be 10 or less');
    }
    if (!createDto.from) {
      throw new BadRequestException(
        'I need a wallet or card from recharge card',
      );
    }
    if (!createDto.to) {
      throw new BadRequestException('I need a card to recharge');
    }
    const to = await this.getAccountService().findOneById(
      createDto.to.toString(),
    );
    if (!to) {
      throw new BadRequestException('Card is not valid');
    }
    if (to.type != TypesAccountEnum.CARD) {
      this.logger.error('[rechargeOne] Type not same');
      throw new BadRequestException('Card not found');
    }
    const valueToPay = to.type === TypesAccountEnum.CARD ? 0 : 5;
    const from = await this.getAccountService().findOneById(
      createDto.from.toString(),
    );
    // if (from.type != TypesAccountEnum.WALLET) {
    //   this.logger.error(
    //     'Type not same',
    //     CardServiceController.name,
    //     'Card.rechargeOne.wallet',
    //   );
    //   throw new BadRequestException('Wallet not found');
    // }
    if (!from) {
      throw new BadRequestException('Wallet or Card not valid');
    }
    if (from.amount < createDto.amount) {
      throw new BadRequestException('Wallet or Card with enough balance');
    }
    const depositCardCategory =
      await this.cardBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'deposit-card',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      );
    const withdrawSlug = `withdrawal-${from.type?.toLowerCase()}`;
    const withdrawalCategory =
      await this.cardBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: withdrawSlug,
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      );
    const approvedStatus = await this.cardBuilder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      'approved',
    );
    const internalPspAccount =
      await this.cardBuilder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      );
    if (valueToPay > 0) {
      // Pay transfer between cards
      this.logger.info('[rechargeOne] Pay transfer between cards', 'Make');
    }
    const fromName = `${from.name ?? from.firstName}`;
    const toName = `${to.name ?? to.firstName}`;
    this.cardBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Deposit card ${toName}`,
        description: `Deposit from ${fromName} to ${toName}`,
        page: `from-${from._id}-to-${to._id}-host-${req.get('Host')}`,
        leadCrmName: `${from.type}2${to.type}`,
        currency: to.currency,
        amount: createDto.amount,
        currencyCustodial: to.currencyCustodial,
        amountCustodial: createDto.amount,
        account: to._id,
        userCreator: req?.user?.id,
        userAccount: to.owner,
        typeAccount: to.type,
        typeAccountType: to.accountType,
        typeTransaction: depositCardCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.deposit,
        statusPayment: StatusCashierEnum.APPROVED,
        isApprove: true,
        status: approvedStatus._id,
        brand: to.brand,
        crm: to.crm,
        confirmedAt: new Date(),
        approvedAt: new Date(),
      } as unknown as TransferCreateDto,
    );
    this.cardBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Withdrawal wallet ${toName}`,
        description: `Withdrawal from ${fromName} to ${toName}`,
        page: `from-${from._id}-to-${to._id}-host-${req.get('Host')}`,
        leadCrmName: `${from.type}2${to.type}`,
        currency: from.currency,
        amount: createDto.amount,
        currencyCustodial: from.currencyCustodial,
        amountCustodial: createDto.amount,
        account: from._id,
        userCreator: req?.user?.id,
        userAccount: from.owner,
        typeAccount: from.type,
        typeAccountType: from.accountType,
        typeTransaction: withdrawalCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.withdrawal,
        statusPayment: StatusCashierEnum.APPROVED,
        isApprove: true,
        status: approvedStatus._id,
        brand: from.brand,
        crm: from.crm,
        confirmedAt: new Date(),
        approvedAt: new Date(),
      } as unknown as TransferCreateDto,
    );
    from.amount = from.amount - createDto.amount;
    return from;
  }

  @Patch('physical-active')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async physicalActive(
    @Body() configActive: ConfigCardActivateDto,
    @Req() req?: any,
  ) {
    return this.physicalActiveCard(
      configActive,
      await this.getValidUserFromReq(req),
    );
  }

  async getValidUserFromReq(@Req() req?: any) {
    const user: User = await this.getUser(req?.user?.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    if (!user.personalData) {
      throw new BadRequestException('Profile of user not found');
    }
    if (!user.personalData.location?.address) {
      throw new BadRequestException('Location address not found');
    }
    this.logger.info(`[getValidUserFromReq] User ${JSON.stringify(user)}`);
    return user;
  }

  async physicalActiveCard(configActivate: ConfigCardActivateDto, user) {
    if (!configActivate.pan) {
      throw new BadRequestException('PAN code is necesary');
    }
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );
    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }
    try {
      if (!user.userCard) {
        user.userCard = await this.getUserCard(cardIntegration, user);
      }
    } catch (err) {
      this.logger.error(
        `[physicalActiveCard] Error in card profile creation ${err}`,
      );
      throw new BadRequestException('Card profile not found');
    }
    this.logger.info(
      `[physicalActiveCard] pin active card ${configActivate.pin}`,
    );
    if (!configActivate.pin && configActivate.pin?.length !== 4) {
      configActivate.pin = CommonService.getNumberDigits(
        CommonService.randomIntNumber(9999),
        4,
      );
    }
    const request = {
      user_id: user.userCard.id,
      pin: configActivate.pin,
      previous_card_id: undefined,
      pan: configActivate.pan,
    };
    if (configActivate.prevCardId) {
      request.previous_card_id = configActivate.prevCardId;
    }
    const rta = await cardIntegration.activateCard(
      user.userCard,
      configActivate,
    );
    this.logger.info(
      `[physicalActiveCard] rta actived card ${JSON.stringify(rta)}`,
    );
    if (rta) {
      if (!!rta['error']) {
        const details: Array<string> = (rta['error']['details'] || []).map(
          (err) => err.detail,
        );
        this.logger.error(
          `[physicalActiveCard] activate card ${JSON.stringify(details)}`,
        );
        throw new BadRequestException(details.join(','));
      }
      const cardId = (rta.data && rta.data['id']) || rta['id'];
      this.logger.info(`[physicalActiveCard] cardId actived ${cardId}`);

      const createdAt = new Date();

      const outbox = {
        _id: new mongoose.Types.ObjectId(),
        topic: EventsNamesAccountEnum.setAffinityGroup,
        correlationId: cardId,
        jsonPayload: JSON.stringify({ cardId, user, configActivate }),
        createdAt,
        updatedAt: createdAt,
        publishAfter: new Date(createdAt.getTime() + 15 * 1000),
      } satisfies OutboxCreateDto;

      await this.outboxService.create(outbox);

      return {
        statusCode: HttpStatus.OK,
        data: 'Card actived',
      };
    }
    return rta;
  }

  @EventPattern(EventsNamesAccountEnum.setAffinityGroup)
  async setAffinityGroupEventHandler(
    @Payload() data: string,
    @Ctx() ctx: RmqContext,
  ) {
    CommonService.ack(ctx);
    this.logger.info(`[setAffinityGroupEventHandler] ${data}`);

    const { cardId, user, configActivate } = JSON.parse(data);

    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );

    let crd = null;
    let card = null;
    let cards = null;
    try {
      cards = await cardIntegration.getCard(cardId);
      this.logger.info(
        `[physicalActiveCard] Result pomelo active ${JSON.stringify(cards)}`,
      );
      crd = cards.data;
      this.logger.info(`[physicalActiveCard] Search card active ${cardId}`);
      card = await this.cardService.findAll({
        where: {
          'cardConfig.id': crd.id,
        },
      });
    } catch (err) {
      this.logger.error(`[physicalActiveCard] Error get card pomelo ${err}`);
      throw new BadRequestException('Get Card error');
    }
    if (!card.totalElements) {
      const cardDto = this.buildCardDto(crd, user.personalData, user.email);
      cardDto.pin = configActivate.pin;
      const n_card = await this.cardService.createOne(
        cardDto as AccountCreateDto,
      );
      this.logger.info(
        `[physicalActiveCard] Card created ${n_card.id} for ${user.email}`,
      );
      let afgName = 'grupo-1';
      if (configActivate.promoCode == 'pm2413') {
        afgName = 'grupo-3';
      }
      const cardAfg = await this.getAfgByLevel(afgName, true);
      const group = await this.buildAFG(null, cardAfg);
      const afg = group.list[0];
      try {
        const rta = await cardIntegration.updateCard({
          id: crd?.id,
          affinity_group_id: afg.valueGroup,
        });
        this.logger.info(
          `[physicalActiveCard] Updated AFG Card-${n_card?.id} ${JSON.stringify(
            rta.data,
          )}`,
        );
        this.cardBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.updateOne,
          {
            id: n_card?.id.toString(),
            group: afg._id,
          },
        );
      } catch (error) {
        this.logger.error(
          `[physicalActiveCard] Update AFG Card-${n_card?.id}-${user.email} ${
            error.message || error
          }`,
        );
        //throw new BadRequestException('Bad update card');
      }
    }

    return {
      statusCode: 200,
      data: 'Card actived',
    };
  }

  @Get('sensitive-info/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async getSensitiveInfo(
    @Param('cardId') cardId: string,
    @Res() res,
    @Req() req?: any,
  ) {
    if (!cardId) {
      throw new BadRequestException('Need cardId to search');
    }
    const cardList = await this.cardService.findAll({
      where: {
        _id: cardId,
      },
    });
    if (!cardList?.totalElements || !cardList?.list[0]?.cardConfig) {
      throw new BadRequestException('CardId is not valid');
    }
    cardId = cardList.list[0].cardConfig.id;
    const user = await this.getValidUserFromReq(req);
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );
    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }
    if (!user.userCard) {
      user.userCard = await this.getUserCard(cardIntegration, user);
    }
    const token = await cardIntegration.getTokenCardSensitive(user.userCard.id);

    const url = 'https://secure-data-web.pomelo.la';
    const cardIdPomelo = cardId;
    const width = 'width="100%"';
    const height = 'height="270em"';
    const locale = 'es';
    const urlStyles =
      'https://cardsstyles.s3.eu-west-3.amazonaws.com/cardsstyles2.css';
    const html = pug.render(
      '<iframe ' +
        `${width}` +
        `${height}` +
        'allow="clipboard-write" ' +
        'class="iframe-list" ' +
        'scrolling="no" ' +
        `src="${url}/v1/${cardIdPomelo}?auth=${token['access_token']}&styles=${urlStyles}&field_list=pan,code,pin,name,expiration&layout=card&locale=${locale}" ` +
        'frameBorder="0">' +
        '</iframe>',
    );
    return res
      .setHeader('Content-Type', 'text/html; charset=utf-8')
      .status(200)
      .send(html);
  }

  @Patch('lock/:cardId')
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async blockedOneById(@Param('cardId') id: string) {
    // TODO: change status ON POMELO
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  @Patch('unlock/:cardId')
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async unblockedOneById(@Param('cardId') id: string) {
    // TODO: change status ON POMELO
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  @Patch('cancel/:cardId')
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async cancelOneById(@Param('cardId') id: string) {
    // TODO: change status ON POMELO
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  @ApiExcludeEndpoint()
  @Patch('hidden/:cardId')
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async disableOneById(@Param('cardId') id: string) {
    return this.toggleVisibleToOwner(id, false);
  }

  @ApiExcludeEndpoint()
  @Patch('visible/:cardId')
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async enableOneById(@Param('cardId') id: string) {
    return this.toggleVisibleToOwner(id, true);
  }

  /*   @ApiExcludeEndpoint()
  @Delete(':cardID')
  deleteOneById(@Param('cardID') id: string, req?: any) {
    //return this.getAccountService().deleteOneById(id);
    throw new UnauthorizedException();
  } */

  @ApiExcludeEndpoint()
  @Get('pomelo/check')
  async checkCardsInPomelo() {
    //await this.checkCardsCreatedInPomelo(null, null);
    this.cardBuilder.emitAccountEventClient(
      EventsNamesAccountEnum.checkCardsCreatedInPomelo,
      'pomelo',
    );
    return {
      statusCode: 200,
      message: 'Started',
    };
  }

  @MessagePattern(EventsNamesAccountEnum.createOneCard)
  async createOneCard(@Ctx() ctx: RmqContext, @Payload() data: CardCreateDto) {
    CommonService.ack(ctx);
    return await this.createOne(data);
  }

  @MessagePattern(EventsNamesAccountEnum.updateOneCard)
  async updateOneCard(
    @Ctx() ctx: RmqContext,
    @Payload() data: AccountUpdateDto,
  ) {
    CommonService.ack(ctx);
    if (data.group) {
      // Actualizar en Pomelo antes
    }
    return await this.updateOne(data);
  }

  @EventPattern(EventsNamesAccountEnum.levelUpCards)
  async levelUpCards(@Ctx() ctx: RmqContext, @Payload() userId: string) {
    CommonService.ack(ctx);
    const user = await this.getUserById(userId);
    const virtualCards = await this.cardService.findAll({
      where: {
        owner: user._id,
        showToOwner: true,
        statusText: [StatusAccountEnum.UNLOCK, StatusAccountEnum.LOCK],
        accountType: CardTypesAccountEnum.VIRTUAL,
      },
    });
    const level = await this.getCategoryById(user.level);
    if (virtualCards.totalElements > 0) {
      const cardAfg = this.getAfgByLevel(level.slug, false);
      if (!cardAfg || cardAfg === AfgNamesEnum.NA)
        throw new NotFoundException(`AFG not found for level ${level.slug}`);
      const group = await this.buildAFG(null, cardAfg);
      const afg = group.list[0];
      if (!afg) {
        this.logger.info(
          `[levelUpCards] AFG not found group ${JSON.stringify(cardAfg)}`,
        );
        throw new NotFoundException('AFG not found');
      }
      const cardIntegration = await this.integration.getCardIntegration(
        IntegrationCardEnum.POMELO,
      );
      if (!cardIntegration) {
        throw new BadRequestException('Bad integration card');
      }
      for (const card of virtualCards.list) {
        try {
          const rta = await cardIntegration.updateCard({
            id: card.cardConfig.id,
            affinity_group_id: afg.valueGroup,
          });
          this.logger.info(
            `[levelUpCards] Updated AFG Card-${card._id} ${JSON.stringify(
              rta.data,
            )}`,
          );
          this.cardBuilder.emitAccountEventClient(
            EventsNamesAccountEnum.updateOne,
            {
              id: card._id.toString(),
              group: afg._id,
            },
          );
        } catch (error) {
          this.logger.error(
            `[levelUpCards] LevelUpCard-${card._id} ${error.message || error}`,
          );
          throw new BadRequestException('Bad update card');
        }
      }
    }
    const physicalCards = await this.cardService.findAll({
      where: {
        owner: user._id,
        showToOwner: true,
        statusText: [
          StatusAccountEnum.UNLOCK,
          StatusAccountEnum.LOCK,
          StatusAccountEnum.ORDERED,
          StatusAccountEnum.VERIFIED,
          StatusAccountEnum.SHIPPED,
          StatusAccountEnum.DELIVERED,
        ],
        accountType: CardTypesAccountEnum.PHYSICAL,
      },
    });
    if (physicalCards.totalElements > 0) {
      physicalCards.list.forEach((card) => {
        this.cardBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.createOneCard,
          {
            force: true,
            owner: user._id,
            type: TypesAccountEnum.CARD,
            prevAccount: card._id.toString(),
            statusText: StatusAccountEnum.ORDERED,
            accountType: CardTypesAccountEnum.PHYSICAL,
          },
        );
      });
    } else {
      if (level.name.indexOf(3) > -1 || level.name.indexOf(4) > -1) {
        // Si grupos 3 o 4 enviar mensaje a support@b2fintech.com
      } else if (level.name.indexOf(1) > -1 || level.name.indexOf(2) > -1) {
        this.cardBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.createOneCard,
          {
            owner: user._id,
            accountType: CardTypesAccountEnum.PHYSICAL,
          },
        );
      }
    }
  }

  private async getUserById(id: string) {
    const user = await this.cardBuilder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      id,
    );
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  @MessagePattern(EventsNamesAccountEnum.pomeloTransaction)
  async processPomeloTransaction(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      this.logger.info(
        `[processPomeloTransaction] Looking for card: ${data.id}`,
      );
      const cardList = await this.cardService.findAll({
        where: {
          'cardConfig.id': data.id,
        },
      });
      const card = cardList.list[0];
      if (!card) {
        this.logger.info(
          `[processPomeloTransaction] Card proccess: ${CardsEnum.CARD_PROCESS_CARD_NOT_FOUND}`,
        );
        return CardsEnum.CARD_PROCESS_CARD_NOT_FOUND;
      }

      if (card.statusText === StatusAccountEnum.LOCK) {
        this.logger.info(
          `[processPomeloTransaction] Card proccess: ${CardsEnum.CARD_PROCESS_CARD_LOCKED}`,
        );
        return CardsEnum.CARD_PROCESS_CARD_LOCKED;
      }

      this.logger.info(
        `[processPomeloTransaction] Card balance: ${card.amount} | Movement amount: ${data.amount}`,
      );
      if (data.authorize) {
        const allowedBalance =
          card.amount * (1 - this.BLOCK_BALANCE_PERCENTAGE);

        const totalMount = data.amount * (1 + data.commision);

        if (allowedBalance <= totalMount) {
          this.logger.info(
            `[processPomeloTransaction] Card proccess: ${CardsEnum.CARD_PROCESS_INSUFFICIENT_FUNDS}`,
          );
          return CardsEnum.CARD_PROCESS_INSUFFICIENT_FUNDS;
        }
      }

      const txnAmount =
        data.movement.toUpperCase() === 'DEBIT'
          ? data.amount * (1 + data.commision) * -1
          : data.amount * (1 + data.commision);

      await this.cardService.customUpdateOne({
        id: card._id,
        $inc: {
          amount: txnAmount,
        },
      });

      this.logger.info(
        `[processPomeloTransaction] Card proccess: ${CardsEnum.CARD_PROCESS_OK}`,
      );

      return CardsEnum.CARD_PROCESS_OK;
    } catch (error) {
      this.logger.error(`[processPomeloTransaction] ${error}`);
      this.logger.info(
        `[processPomeloTransaction] Card proccess: ${CardsEnum.CARD_PROCESS_FAILURE}`,
      );
      return CardsEnum.CARD_PROCESS_FAILURE;
    }
  }

  @MessagePattern(EventsNamesAccountEnum.findOneByCardId)
  async findByCardId(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      this.logger.info(`[findByCardId] Looking for card: ${data.id}`);
      const cardList = await this.getCardById(data.id);
      if (!cardList || !cardList.list[0]) {
        throw new NotFoundException(`Card ${data.id} was not found`);
      }
      return cardList.list[0];
    } catch (error) {
      this.logger.error(`[findByCardId] Error-cfindByCardId ${error}`);
    }
  }

  private async getCardById(cardId: string) {
    try {
      this.logger.info(`[getCardById] Looking for card: ${cardId}`);
      const cardList = await this.cardService.findAll({
        where: {
          'cardConfig.id': cardId,
        },
      });
      return cardList;
    } catch (error) {
      this.logger.error(`[getCardById] Error-getCardId ${error}`);
    }
  }

  @MessagePattern(EventsNamesAccountEnum.checkCardsCreatedInPomelo)
  async checkCardsCreatedInPomelo(
    @Ctx() ctx: RmqContext,
    @Payload() data: any,
  ) {
    CommonService.ack(ctx);

    const IS_PROCESSING_CHECK_CARDS_IN_POMELO =
      'isProcessingCheckCardsInPomelo';

    const checkCardsInPomelo = await this.cacheManager.get<boolean>(
      IS_PROCESSING_CHECK_CARDS_IN_POMELO,
    );

    if (checkCardsInPomelo) return;

    await this.cacheManager.set(
      IS_PROCESSING_CHECK_CARDS_IN_POMELO,
      true,
      5 * 60 * 1000,
    );

    try {
      this.logger.info(`[checkCardsCreatedInPomelo] Start`);
      const paginator: ResponsePaginator<User> = new ResponsePaginator<User>();
      paginator.currentPage = 1;
      paginator.firstPage = 1;
      const cardIntegration = await this.integration.getCardIntegration(
        IntegrationCardEnum.POMELO,
      );
      if (!cardIntegration) {
        throw new BadRequestException('Bad integration card');
      }
      do {
        const usersPaginator: ResponsePaginator<User> =
          await this.cardBuilder.getPromiseUserEventClient(
            EventsNamesUserEnum.findAll,
            {
              relations: ['personalData'],
              page: paginator.currentPage,
            },
          );
        this.logger.info(
          `[checkCardsCreatedInPomelo] Check cards users ${usersPaginator.totalElements}`,
        );
        for (const usr of usersPaginator.list) {
          //this.logger.info(usr?.userCard?.id, `User ${usr.email}`);
          if (usr.userCard) {
            const cards = await cardIntegration.getCardByQuery({
              user_id: usr.userCard.id,
              page_size: 1000,
            });
            //this.logger.info(cards, `Result pomelo`);
            for (const crd of cards.data) {
              //this.logger.info(crd.id, `Search card`);
              const card = await this.cardService.findAll({
                where: {
                  'cardConfig.id': crd.id,
                },
              });
              if (!card.totalElements) {
                const cardDto = this.buildCardDto(
                  crd,
                  usr.personalData,
                  usr.email,
                );
                const n_card = await this.cardService.createOne(
                  cardDto as AccountCreateDto,
                );
                this.logger.info(
                  `[checkCardsCreatedInPomelo] Card created ${n_card.id} for ${usr.email}`,
                );
              } else if (
                card.totalElements === 1 &&
                card.list[0].statusText === StatusAccountEnum.ORDERED &&
                crd.status === StatusAccountEnum.ACTIVE
              ) {
                card.list[0].statusText = StatusAccountEnum.UNLOCK;
                card.list[0].save();
                this.logger.info(
                  `[checkCardsCreatedInPomelo] Card updated ${card.list[0]?.id} for ${usr.email}`,
                );
              }
            }
          }
        }
        paginator.currentPage = usersPaginator.nextPage;
        paginator.nextPage = usersPaginator.nextPage;
      } while (paginator.nextPage !== paginator.firstPage);
    } catch (error) {
      this.logger.error(`[checkCardsCreatedInPomelo] ${error}`);
    }
  }
  private buildCardDto(
    pomeloCard: any,
    person: any,
    email: string,
    balance = 0,
  ) {
    let statusText: string;
    if (pomeloCard?.status === 'ACTIVE') {
      statusText = StatusAccountEnum.UNLOCK;
    } else if (pomeloCard?.status === 'BLOCKED') {
      statusText = StatusAccountEnum.LOCK;
    } else {
      statusText = StatusAccountEnum.CANCEL;
    }
    return {
      name: person?.firstName,
      pin: undefined,
      type: TypesAccountEnum.CARD,
      accountType: CardTypesAccountEnum[pomeloCard.card_type],
      firstName: person?.firstName ?? person?.name,
      lastName: person?.lastName,
      docId: person?.numDocId,
      address: person?.location?.address,
      email: email,
      telephone: person?.phoneNumber,
      description: pomeloCard?.affinity_group_name,
      afgId: pomeloCard?.affinity_group_id,
      accountId: pomeloCard?.id,
      owner: person?.user,
      statusText,
      amount: balance ?? 0,
      currency: CurrencyCodeB2cryptoEnum.USDT,
      amountCustodial: balance ?? 0,
      currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
      amountBlocked: 0,
      currencyBlocked: CurrencyCodeB2cryptoEnum.USDT,
      amountBlockedCustodial: 0,
      currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USDT,
      cardConfig: {
        id: pomeloCard?.id,
        user_id: pomeloCard?.user_id,
        affinity_group_id: pomeloCard?.affinity_group_id,
        card_type: pomeloCard?.card_type,
        status: pomeloCard?.status,
        start_date: pomeloCard?.start_date,
        last_four: pomeloCard?.last_four,
        provider: pomeloCard?.provider,
        product_type: pomeloCard?.product_type,
        address: {
          street_name: person?.location?.address?.street_name,
          street_number: person?.location?.address?.street_number,
          floor: person?.location?.address?.floor ?? '',
          apartment: person?.location?.address?.apartment ?? '',
          city: person?.location?.address?.city,
          region: person?.location?.address?.region,
          country: CountryCodeEnum.Colombia,
          zip_code: person?.location?.address?.zip_code,
          neighborhood: person?.location?.address?.neighborhood,
        },
      },
    };
  }

  @MessagePattern(EventsNamesAccountEnum.setBalanceByCard)
  async setBalanceByCard(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      this.logger.info(`[setBalanceByCard] Looking for card: ${data.id}`);
      const cardList = await this.cardService.findAll({
        where: {
          'cardConfig.id': data.id,
        },
      });
      if (!cardList || !cardList.list[0]) {
        throw new NotFoundException(`Card ${data.id} was not found`);
      }
      const card = cardList.list[0];
      await this.cardService.customUpdateOne({
        id: card._id,
        $inc: {
          amount: card.amount ? 0 : data.amount,
          amountCustodial: card.amountCustodial ? 0 : data.amount,
        },
      });
    } catch (error) {
      this.logger.error(`[setBalanceByCard] ${error}`);
    }
  }

  private async getUserCard(
    cardIntegration: IntegrationCardService,
    user: User,
    account?: AccountDocument,
  ) {
    if (!user?.email) {
      throw new BadRequestException('Email not found');
    }
    // TODO[hender - 2024/08/12] Check the Surname, City, Region to remove special characters
    // TODO[hender - 2024/08/12] Check the Surname, City, Region to remove numbers
    const rtaUserCard = await cardIntegration.getUser({
      email: user.email.toLowerCase(),
    });
    let userCardConfig: UserCard;
    if (rtaUserCard.data.length > 0) {
      userCardConfig = rtaUserCard.data[0];
    } else {
      let birthDate = account?.personalData?.birth ?? user.personalData.birth;
      if (!birthDate) {
        throw new BadRequestException('Birth not found');
      }
      birthDate = new Date(birthDate);
      const legalAddress = this.getLegalAddress(
        account?.personalData?.location.address ??
          user.personalData.location.address,
      );
      const country = 'COL';
      /* const country = countries.filter(
        (country) =>
          country.alpha2 ===
          (account?.country ?? user.personalData.nationality),
      )[0].alpha3; */
      legalAddress.country = country;
      let typeDocId: string =
        account?.personalData?.typeDocId ?? user.personalData.typeDocId;
      switch (typeDocId) {
        case DocIdTypeEnum.PERMISO_PROTECCION_TEMPORAL:
          typeDocId = 'PPT';
          break;
        case DocIdTypeEnum.PASSPORT:
          typeDocId = 'PASSPORT';
          break;
      }

      const userCardDto = {
        name: account?.personalData?.name ?? user.personalData.name,
        surname: account?.personalData?.lastName ?? user.personalData.lastName,
        identification_type: typeDocId,
        identification_value:
          account?.personalData?.numDocId ??
          user.personalData.numDocId?.toString(),
        birthdate: `${birthDate.getFullYear()}-${CommonService.getNumberDigits(
          birthDate.getMonth() + 1,
          2,
        )}-${CommonService.getNumberDigits(birthDate.getDate(), 2)}`,
        gender: account?.personalData?.gender ?? user.personalData.gender,
        email: account?.email ?? user.personalData.email[0] ?? user.email,
        phone:
          account?.telephone ??
          user.personalData.telephones[0]?.phoneNumber ??
          user.personalData.phoneNumber,
        nationality: country,
        legal_address: legalAddress,
        operation_country: country,
        zip_code: legalAddress.zip_code,
      } as unknown as UserCardDto;

      this.logger.info(
        `[createOne] userCardDto: ${JSON.stringify(userCardDto)}`,
      );

      const userCardCreated = await cardIntegration.createUser(
        userCardDto,
        null,
        AbortSignal.timeout(15000),
      );

      this.logger.info(
        `[createOne] userCardCreated: ${JSON.stringify(userCardCreated)}`,
      );

      const error = userCardCreated['error'];

      if (error) {
        throw new BadRequestException(error);
      }
      userCardConfig = userCardCreated.data as unknown as UserCard;
    }
    await this.cardBuilder.getPromiseUserEventClient(
      EventsNamesUserEnum.updateOne,
      {
        id: user._id,
        userCard: userCardConfig,
      },
    );

    this.logger.info(
      `[createOne] userCardConfig: ${JSON.stringify(userCardConfig)}`,
    );

    return userCardConfig;
  }

  private getLegalAddress(address: AddressSchema): AddressSchema {
    if (!address) {
      throw new BadRequestException('Address not found in profile address');
    }
    if (!address.street_name) {
      throw new BadRequestException('Street name not found in profile address');
    }
    if (address.street_number) {
      address.street_number = ' ';
    }
    if (!address.city) {
      // Validate cities
      throw new BadRequestException('City not found in profile address');
    }
    if (!address.region) {
      // Validate regions
      throw new BadRequestException('Region not found in profile address');
    }
    if (!address.neighborhood) {
      address.neighborhood = ' ';
    }
    if (!address.zip_code) {
      address.zip_code = '05002';
    }
    address.country = CountryCodeEnum.Colombia;
    /* if (!address.country) {
      // Validate cities
      throw new BadRequestException('Country not found in profile address');
    } */
    if (
      isString(address.additional_info) &&
      isEmpty(address.additional_info.trim())
    ) {
      address.additional_info = ' ';
    }

    return address;
  }
}
