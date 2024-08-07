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
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiTags } from '@nestjs/swagger';
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
  ) {
    super(cardService, cardBuilder);
  }

  private readonly BLOCK_BALANCE_PERCENTAGE: number =
    this.configService.get<number>('AUTHORIZATIONS_BLOCK_BALANCE_PERCENTAGE');

  @Get('all')
  @ApiTags('Stakey Card')
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  findAll(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    return this.cardService.findAll(query);
  }
  @Get('me')
  @ApiTags('Stakey Card')
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  findAllMe(@Query() query: QuerySearchAnyDto, @Req() req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    query = CommonService.getQueryWithUserId(query, req, 'owner');
    return this.cardService.findAll(query);
  }

  @Post('create')
  @ApiTags('Stakey Card')
  @ApiBearerAuth('bearerToken')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
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
    createDto.owner = user.id;
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
        const afg = {
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
        if (!afg) {
          throw new BadRequestException('Affinity group list is empty');
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
        account.group = group.list[0];
      }
      // Create Card
      const card = await cardIntegration.createCard({
        user_id: account.userCardConfig.id,
        affinity_group_id: account.group.valueGroup,
        card_type: account.accountType,
        email: account.email,
        address: {
          street_name: user.personalData.location.address.street_name,
          street_number: user.personalData.location.address.street_number,
          floor: user.personalData.location.address.floor,
          apartment: user.personalData.location.address.apartment,
          city: user.personalData.location.address.city,
          region: user.personalData.location.address.region,
          //country: user.personalData.location.address.country ?? 'Colombia',
          country: 'Colombia',
          zip_code: user.personalData.location.zipcode,
          neighborhood: user.personalData.location.address.neighborhood,
        },
        /*address:
          account.personalData?.location.address ??
          user.personalData.location.address,*/
        previous_card_id: account.prevAccount?.cardConfig?.id ?? null,
        // After first access remove pin
        pin: account.pin,
        name_on_card: account.name,
      });
      const error = card['error'];
      if (error) {
        throw new BadRequestException(error);
      }
      account.cardConfig = card.data as unknown as Card;
      account.save();
      return account;
    } catch (err) {
      Logger.error(err, 'Account Card not created');
      await this.getAccountService().deleteOneById(account._id);
      return err;
    }
  }

  @Get('shipping/:idCard')
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
    //TODO[hender-2024/07/25] Cretification Pomelo
    const rtaGetShipping = await cardIntegration.getShippingPhysicalCard(
      card.responseShipping.id,
    );
    Logger.log(rtaGetShipping, 'Shipping');
    return card.responseShipping;
  }

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
        neighborhood: user.personalData.location.address.neighborhood,
        country: user.personalData.location.address.country,
        apartment: user.personalData.location.address.apartment,
      },
      receiver: {
        full_name: user.personalData.name,
        email: user.email,
        document_type: user.personalData.typeDocId,
        document_number: user.personalData.numDocId,
        telephone_number: user.personalData.telephone[0].phoneNumber,
      },
    });
    if (rtaShippingCard.data.id) {
      const account = await this.cardService.createOne({
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
    if (createDto.amount <= 0) {
      throw new BadRequestException('The recharge not be 0 or less');
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
    // Create
    return Promise.all([
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
      Logger.log(`Looking for card: ${data.id}`, 'CardController');
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
          'CardController',
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
      Logger.error(error, 'CardController');
      return CardsEnum.CARD_PROCESS_FAILURE;
    }
  }

  @MessagePattern(EventsNamesAccountEnum.findOneByCardId)
  async findByCardId(@Ctx() ctx: RmqContext, @Payload() data: any) {
    CommonService.ack(ctx);
    try {
      Logger.log(`Looking for card: ${data.id}`, 'CardController');
      const cardList = await this.cardService.findAll({
        where: {
          'cardConfig.id': data.id,
        },
      });
      if (!cardList || !cardList.list[0]) {
        throw new NotFoundException(`Card ${data.id} was not found`);
      }
      return cardList.list[0];
    } catch (error) {
      Logger.error(error, 'CardController');
    }
  }

  private async getUserCard(
    cardIntegration: IntegrationCardService,
    user: User,
    account?: AccountDocument,
  ) {
    const rtaUserCard = await cardIntegration.getUser({
      email: user.email,
    });
    let userCardConfig: UserCard;
    if (rtaUserCard.data.length > 0) {
      userCardConfig = rtaUserCard.data[0];
    } else {
      const birthDate = account?.personalData?.birth ?? user.personalData.birth;
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
        )}-${birthDate.getDate()}`,
        gender: account?.personalData?.gender ?? user.personalData.gender,
        email: account?.email ?? user.personalData.email[0] ?? user.email,
        phone: account?.telephone ?? user.personalData.telephone[0],
        tax_identification_type:
          account?.personalData?.taxIdentificationType ??
          user.personalData.taxIdentificationType,
        tax_identification_value:
          account?.personalData?.taxIdentificationValue ??
          user.personalData.taxIdentificationValue,
        nationality:
          account?.personalData?.nationality ?? user.personalData.nationality,
        legal_address:
          account?.personalData?.location.address ??
          user.personalData.location.address,
        operation_country: account?.country ?? user.personalData.nationality,
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
}
