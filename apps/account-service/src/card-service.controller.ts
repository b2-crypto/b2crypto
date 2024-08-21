import { LegalAddress } from './../../../libs/integration/src/card/generic/dto/user.card.dto';
import { CardDepositCreateDto } from '@account/account/dto/card-deposit.create.dto';
import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { Card } from '@account/account/entities/mongoose/card.schema';
import { UserCard } from '@account/account/entities/mongoose/user-card.schema';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { IntegrationService } from '@integration/integration';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { UserCardDto } from '@integration/integration/card/generic/dto/user.card.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Logger,
  NotFoundException,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiSecurity,
  ApiTags,
} from '@nestjs/swagger';
import { User } from '@user/user/entities/mongoose/user.schema';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import {
  Ctx,
  EventPattern,
  MessagePattern,
  Payload,
  RmqContext,
} from '@nestjs/microservices';
import { TransferUpdateDto } from '@transfer/transfer/dto/transfer.update.dto';
import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import { ConfigService } from '@nestjs/config';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { IntegrationCardService } from '@integration/integration/card/generic/integration.card.service';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { CardsEnum } from '@common/common/enums/messages.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import { ApiKeyAuthGuard } from '@auth/auth/guards/api.key.guard';
import { AddressSchema } from '@person/person/entities/mongoose/address.schema';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { FiatIntegrationClient } from 'apps/integration-service/src/clients/fiat.integration.client';
import { AccountEntity } from '@account/account/entities/account.entity';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { SwaggerSteakeyConfigEnum } from 'libs/config/enum/swagger.stakey.config.enum';
import { countries } from 'apps/seed-service/const/countries.const';
import { isEmpty, isString } from 'class-validator';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import { PspAccount } from '@psp-account/psp-account/entities/mongoose/psp-account.schema';
import { NoCache } from '@common/common/decorators/no-cache.decorator';

@ApiTags('CARD')
@Controller('cards')
export class CardServiceController extends AccountServiceController {
  constructor(
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
  ) {
    super(cardService, cardBuilder);
  }

  private readonly BLOCK_BALANCE_PERCENTAGE: number =
    this.configService.get<number>('AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE');

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
      Logger.error(err, 'CardController');
      return account.amountCustodial || account.amount;
    }
  }

  @Get('me')
  @NoCache()
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiBearerAuth('bearerToken')
  async findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    const rta = await this.cardService.findAll(query);
    rta.list.forEach(async (account) => {
      account.amount = await this.swapToCurrencyUser(req, account);
      account.currency = req.user.currency ?? CurrencyCodeB2cryptoEnum.USD;
    });
    return rta;
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @Post('create')
  @UseGuards(ApiKeyAuthGuard)
  async createOne(@Body() createDto: CardCreateDto, @Req() req?: any) {
    createDto.accountType =
      createDto.accountType ?? CardTypesAccountEnum.VIRTUAL;
    if (createDto.accountType === CardTypesAccountEnum.PHYSICAL) {
      throw new BadRequestException(
        'You must be use "/cards/shipping" to get a PHYSICAL card',
      );
    }
    const user: User = await this.getUser(req?.user?.id);
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    const virtualCardPending = await this.cardService.findAll({
      where: {
        owner: user._id,
        accountType: CardTypesAccountEnum.VIRTUAL,
      },
    });
    // TODO[hender - 2024/08/12] Limit virtual card
    if (virtualCardPending.totalElements === 10) {
      throw new BadRequestException('Already have 10 virtual cards');
    }
    createDto.owner = user._id;
    createDto.pin =
      createDto.pin ??
      parseInt(
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
      );
    const account = await this.cardService.createOne(createDto);
    try {
      const cardIntegration = await this.integration.getCardIntegration(
        IntegrationCardEnum.POMELO,
        account,
      );
      if (!cardIntegration) {
        throw new BadRequestException('Bad integration card');
      }
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
      account.email = account.email ?? user.personalData.email[0] ?? user.email;
      // Validate Affinity Group
      if (!account?.group?.valueGroup) {
        /* const affinityGroup = await cardIntegration.getAffinityGroup(
          account.userCardConfig,
        );
        const afg = affinityGroup.data[0]; */
        // TODO[hender - 2024/06/05]
        const group = await this.buildAFG();
        account.group = group.list[0];
      }
      // Create Card
      const address = {
        street_name: user.personalData.location.address.street_name,
        street_number: user.personalData.location.address.street_number ?? ' ',
        floor: user.personalData.location.address.floor,
        apartment: user.personalData.location.address.apartment,
        city: user.personalData.location.address.city,
        region: user.personalData.location.address.region,
        country: 'COL',
        /* country: countries.filter(
          (c) => c.alpha2 === user.personalData.nationality,
        )[0].alpha3, */
        zip_code: user.personalData.location.address.zip_code ?? '110231',
        neighborhood: user.personalData.location.address.neighborhood,
      };
      const card = await cardIntegration.createCard({
        user_id: account.userCardConfig.id,
        affinity_group_id: account.group.valueGroup,
        card_type: account.accountType,
        email: account.email,
        address: address,
        previous_card_id: account.prevAccount?.cardConfig?.id ?? null,
        //name_on_card: account.name,
      });
      const error = card['error'];
      if (error) {
        // TODO[hender - 2024-08-12] If problems with data user in Pomelo, flag to update in pomelo when update profile user
        throw new BadRequestException(error);
      }
      account.cardConfig = card.data as unknown as Card;
      account.save();
      const countWalletsUser =
        await this.cardBuilder.getPromiseAccountEventClient(
          EventsNamesAccountEnum.count,
          {
            where: {
              type: TypesAccountEnum.WALLET,
              owner: account.owner,
            },
          },
        );
      if (countWalletsUser < 1)
        this.cardBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.createOneWallet,
          {
            owner: account.owner,
            name: 'USDT',
            pin: CommonService.getNumberDigits(
              CommonService.randomIntNumber(4),
              4,
            ),
            accountType: 'STABLECOIN',
          },
        );
      return account;
    } catch (err) {
      await this.getAccountService().deleteOneById(account._id);
      Logger.error(err.response, `Account Card not created ${account._id}`);
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
    }
  }

  private getAfgVirtualProd() {
    return {
      id: 'afg-2dK0sh37O9A2pPMxdBaaUcfApIb',
      name: 'B2Crypto COL Mastercard credit virtual',
      card_type_supported: ['VIRTUAL'],
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
      status: 'ACTIVE',
      embossing_company: 'THALES',
      courier_company: 'DOMINA',
      exchange_currency_name: 'COP',
      activation_code_enabled: false,
      total_exchange_rate: 4021.63,
      total_non_usd_exchange_rate: 4021.63,
      total_dcc_exchange_rate: 4021.63,
      provider: 'MASTERCARD',
      custom_name_on_card_enabled: false,
      provider_algorithm: 'MCHIP',
      start_date: '2024-03-06',
      dcvv_enabled: false,
    };
  }

  private getAfgVirtualCommercialProd() {
    return {
      id: 'afg-2i3XVNYWvg9u76TFZi4FitF3VpD',
      name: 'B2Crypto COL Mastercard Commercial credit virtual ',
      card_type_supported: ['VIRTUAL'],
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
      product_id: 'prd-2hZAQouC4B4qDag9W21MozKlqzU',
      local_extracash_allowed: true,
      international_extracash_allowed: true,
      plastic_model: 1,
      kit_model: 1,
      status: 'ACTIVE',
      embossing_company: 'THALES',
      courier_company: 'DOMINA',
      exchange_currency_name: 'COP',
      activation_code_enabled: false,
      total_exchange_rate: 4021.63,
      total_non_usd_exchange_rate: 4021.63,
      total_dcc_exchange_rate: 4021.63,
      provider: 'MASTERCARD',
      custom_name_on_card_enabled: false,
      provider_algorithm: 'MCHIP',
      start_date: '2024-06-18',
      dcvv_enabled: false,
    };
  }

  private getAfgVirtualNominatedStage() {
    return {
      id: 'afg-2arMn990ZksFKAHS5PngRPHqRmS',
      name: 'B2Crypto COL physical virtual credit nominated',
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

  private async buildAFG(afgId?: string) {
    let afg =
      process.env.ENVIRONMENT === 'STAGE'
        ? this.getAfgVirtualNominatedStage()
        : process.env.ENVIRONMENT === 'PROD'
        ? this.getAfgVirtualProd()
        : null;
    Logger.debug(
      `AFG: ${JSON.stringify(afg)}`,
      'CardServiceController.buildAFG',
    );
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

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiTags('Stakey Card')
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
    Logger.log(rtaGetShipping, 'Shipping');
    return card.responseShipping;
  }

  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  @Post('shipping')
  async shippingPhysicalCard(@Req() req?: any) {
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
    const physicalCardPending = await this.cardService.findAll({
      where: {
        owner: user._id,
        cardConfig: {
          $exists: false,
        },
      },
    });
    if (physicalCardPending.totalElements > 0) {
      throw new BadRequestException('Already physical card pending');
    }
    const cardIntegration = await this.integration.getCardIntegration(
      IntegrationCardEnum.POMELO,
    );
    if (!cardIntegration) {
      throw new BadRequestException('Bad integration card');
    }
    if (!user.userCard) {
      user.userCard = await this.getUserCard(cardIntegration, user);
    }
    const rtaShippingCard = await cardIntegration.shippingPhysicalCard({
      shipment_type: 'CARD_FROM_WAREHOUSE',
      // TODo[hender-2024/08/02] Default because is available AFG
      affinity_group_id: 'afg-2jc1143Egwfm4SUOaAwBz9IfZKb',
      // TODo[hender-2024/08/02] Default because only COL is authorized
      country: 'COL',
      user_id: user.userCard.id,
      address: {
        street_name: user.personalData.location.address.street_name,
        street_number: ' ',
        city: user.personalData.location.address.city,
        region: user.personalData.location.address.region,
        country: user.personalData.location.address.country,
        neighborhood: user.personalData.location.address.neighborhood,
        apartment: user.personalData.location.address.apartment,
      },
      receiver: {
        full_name: user.personalData.name,
        email: user.email,
        document_type: user.personalData.typeDocId,
        document_number: user.personalData.numDocId,
        telephone_number:
          user.personalData.telephones[0]?.phoneNumber ??
          user.personalData.phoneNumber,
      },
    });

    if (rtaShippingCard.data.id) {
      const account = await this.cardService.createOne({
        type: TypesAccountEnum.CARD,
        accountType: CardTypesAccountEnum.PHYSICAL,
        responseShipping: rtaShippingCard.data,
        address: rtaShippingCard.data.address as any,
        personalData: user.personalData,
        owner: user._id ?? user.id,
      } as AccountCreateDto);
      return account;
    }
    throw new BadRequestException('Shipment was not created');
  }

  @Post('recharge')
  async rechargeOne(@Body() createDto: CardDepositCreateDto, @Req() req?: any) {
    const user: User = await this.getUser(req?.user?.id);
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    if (createDto.amount < 10) {
      throw new BadRequestException('The recharge not be 10 or less');
    }
    if (!createDto.from) {
      throw new BadRequestException('I need a wallet to recharge card');
    }
    const to = await this.getAccountService().findOneById(
      createDto.to.toString(),
    );
    if (to.type != TypesAccountEnum.CARD) {
      throw new BadRequestException('Card not found');
    }
    const from = await this.getAccountService().findOneById(
      createDto.from.toString(),
    );
    if (from.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }
    if (!from) {
      throw new BadRequestException('Wallet is not valid');
    }
    if (from.amount < createDto.amount) {
      throw new BadRequestException('Wallet with enough balance');
    }
    const depositCardCategory =
      await this.cardBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'deposit-card',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      );
    const withDrawalWalletCategory =
      await this.cardBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'withdrawal-wallet',
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
    // Create
    const result = Promise.all([
      this.cardService.customUpdateOne({
        id: createDto.to,
        $inc: {
          amount: createDto.amount,
        },
      }),
      this.cardService.customUpdateOne({
        id: createDto.from.toString(),
        $inc: {
          amount: createDto.amount * -1,
        },
      }),
    ]).then((list) => list[0]);
    this.cardBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Recharge card ${to.name}`,
        description: `Recharge from wallet ${from.name} to card ${to.name}`,
        currency: to.currency,
        amount: createDto.amount,
        currencyCustodial: to.currencyCustodial,
        amountCustodial: createDto.amount,
        account: to._id,
        userCreator: req?.user?.id,
        userAccount: to.owner,
        typeTransaction: depositCardCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.deposit,
        page: req.get('Host'),
        statusPayment: StatusCashierEnum.APPROVED,
        approve: true,
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
        name: `Withdrawal wallet ${from.name}`,
        description: `Recharge from wallet ${from.name} to card ${to.name}`,
        currency: from.currency,
        amount: createDto.amount,
        currencyCustodial: from.currencyCustodial,
        amountCustodial: createDto.amount,
        account: from._id,
        userCreator: req?.user?.id,
        userAccount: from.owner,
        typeTransaction: withDrawalWalletCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.withdrawal,
        page: req.get('Host'),
        statusPayment: StatusCashierEnum.APPROVED,
        approve: true,
        status: approvedStatus._id,
        brand: from.brand,
        crm: from.crm,
        confirmedAt: new Date(),
        approvedAt: new Date(),
      } as unknown as TransferCreateDto,
    );
    return result;
  }

  @Patch('lock/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async blockedOneById(@Param('cardId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.LOCK);
  }

  @Patch('unlock/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async unblockedOneById(@Param('cardId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.UNLOCK);
  }

  @Patch('cancel/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async cancelOneById(@Param('cardId') id: string) {
    return this.updateStatusAccount(id, StatusAccountEnum.CANCEL);
  }

  @Patch('hidden/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async disableOneById(@Param('cardId') id: string) {
    return this.toggleVisibleToOwner(id, false);
  }

  @Patch('visible/:cardId')
  @ApiTags(SwaggerSteakeyConfigEnum.TAG_CARD)
  @ApiSecurity('b2crypto-key')
  @ApiBearerAuth('bearerToken')
  @UseGuards(ApiKeyAuthGuard)
  async enableOneById(@Param('cardId') id: string) {
    return this.toggleVisibleToOwner(id, true);
  }

  @Delete(':cardID')
  deleteOneById(@Param('cardID') id: string, req?: any) {
    return this.getAccountService().deleteOneById(id);
  }

  @MessagePattern(EventsNamesAccountEnum.pomeloTransaction)
  async processPomeloTransaction(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      let txnAmount = 0;
      Logger.log(`Looking for card: ${data.id}`, CardServiceController.name);
      const cardList = await this.cardService.findAll({
        where: {
          statusText: StatusAccountEnum.UNLOCK,
          'cardConfig.id': data.id,
        },
      });
      const card = cardList.list[0];
      if (!card) {
        return CardsEnum.CARD_PROCESS_CARD_NOT_FOUND;
      }
      if (data.authorize) {
        Logger.log(
          `Card balance: ${card.amount} | Movement amount: ${data.amount}`,
          CardServiceController.name,
        );
        const allowedBalance =
          card.amount * (1.0 - this.BLOCK_BALANCE_PERCENTAGE);
        if (allowedBalance <= data.amount) {
          return CardsEnum.CARD_PROCESS_INSUFFICIENT_FUNDS;
        }
        txnAmount = data.amount * -1;
      } else {
        txnAmount =
          data.movement.toUpperCase() === 'DEBIT'
            ? data.amount * -1
            : data.amount * 1;
      }
      await this.cardService.customUpdateOne({
        id: card._id,
        $inc: {
          amount: txnAmount,
        },
      });
      return CardsEnum.CARD_PROCESS_OK;
    } catch (error) {
      Logger.error(error, CardServiceController.name);
      return CardsEnum.CARD_PROCESS_FAILURE;
    }
  }

  @MessagePattern(EventsNamesAccountEnum.findOneByCardId)
  async findByCardId(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      Logger.log(`Looking for card: ${data.id}`, CardServiceController.name);
      const cardList = await this.getCardById(data.id);
      if (!cardList || !cardList.list[0]) {
        throw new NotFoundException(`Card ${data.id} was not found`);
      }
      return cardList.list[0];
    } catch (error) {
      Logger.error(error, CardServiceController.name);
    }
  }

  private async getCardById(cardId: string) {
    try {
      Logger.log(`Looking for card: ${cardId}`, CardServiceController.name);
      const cardList = await this.cardService.findAll({
        where: {
          'cardConfig.id': cardId,
        },
      });
      return cardList;
    } catch (error) {
      Logger.error(error, CardServiceController.name);
    }
  }

  @MessagePattern(EventsNamesAccountEnum.mingrateOne)
  async migrateCard(
    @Ctx() ctx: RmqContext,
    @Payload() cardToMigrate: CardCreateDto,
  ) {
    try {
      CommonService.ack(ctx);
      Logger.log(
        `Migrating card ${cardToMigrate?.cardConfig?.id}`,
        CardServiceController.name,
      );
      const group = await this.buildAFG(cardToMigrate.afgId);
      cardToMigrate.group = group?.list[0];
      const cardList = await this.getCardById(cardToMigrate?.cardConfig?.id);
      if (!cardList || !cardList.list[0]) {
        return await this.cardService.createOne(cardToMigrate);
      } else {
        const card = cardList.list[0];
        await this.cardService.customUpdateOne({
          id: card._id,
          $inc: {
            amount: card.amount ? 0 : cardToMigrate.amount,
            amountCustodial: card.amountCustodial
              ? 0
              : cardToMigrate.amountCustodial,
          },
        });
        return card;
      }
    } catch (error) {
      Logger.error(error, CardServiceController.name);
    }
  }

  @MessagePattern(EventsNamesAccountEnum.setBalanceByCard)
  async setBalanceByCard(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      Logger.log(`Looking for card: ${data.id}`, CardServiceController.name);
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
          amount: card.amount ?? data.amount,
          amountCustodial: card.amountCustodial ?? data.amount,
        },
      });
    } catch (error) {
      Logger.error(error, CardServiceController.name);
    }
  }

  private async getUserCard(
    cardIntegration: IntegrationCardService,
    user: User,
    account?: AccountDocument,
  ) {
    // TODO[hender - 2024/08/12] Check the Surname, City, Region to remove special characters
    // TODO[hender - 2024/08/12] Check the Surname, City, Region to remove numbers
    const rtaUserCard = await cardIntegration.getUser({
      email: user.email,
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
      const userCard = await cardIntegration.createUser({
        name: account?.personalData?.name ?? user.personalData.name,
        surname: account?.personalData?.lastName ?? user.personalData.lastName,
        identification_type:
          account?.personalData?.typeDocId ?? user.personalData.typeDocId,
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
      } as unknown as UserCardDto);
      const error = userCard['error'];
      if (error) {
        throw new BadRequestException(error);
      }
      userCardConfig = userCard.data as unknown as UserCard;
    }
    await this.cardBuilder.getPromiseUserEventClient(
      EventsNamesUserEnum.updateOne,
      {
        id: user._id,
        userCard: userCardConfig,
      },
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
