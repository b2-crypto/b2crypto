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
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiHeader, ApiTags } from '@nestjs/swagger';
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
    this.configService.get<number>('BLOCK_BALANCE_PERCENTAGE');

  @Get('all')
  @ApiTags('Stakey Card')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  findAll(@Query() query: QuerySearchAnyDto, req?: any) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where.type = TypesAccountEnum.CARD;
    return this.cardService.findAll(query);
  }

  @Post('create')
  @ApiTags('Stakey Card')
  @ApiHeader({
    name: 'b2crypto-key',
    description: 'The apiKey',
  })
  async createOne(@Body() createDto: CardCreateDto, @Req() req?: any) {
    createDto.accountType =
      createDto.accountType ?? CardTypesAccountEnum.VIRTUAL;
    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: {
          _id: req?.user.id,
        },
      })
    ).list[0];
    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    createDto.integration = user.id;
    createDto.pin =
      createDto.pin ??
      parseInt(
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
      );
    const account = await this.cardService.createOne(createDto);
    try {
      const cardIntegration = await this.integration.getCardIntegration(
        account,
        IntegrationCardEnum.POMELO,
      );
      if (!cardIntegration) {
        throw new BadRequestException('Bad integration card');
      }
      // Validate User Card
      if (!user.userCard) {
        const rtaUserCard = await cardIntegration.getUser({
          email: user.email,
        });
        if (rtaUserCard.data.length > 0) {
          account.userCardConfig = rtaUserCard.data[0];
        } else {
          const birthDate =
            account.personalData?.birth ?? user.personalData.birth;
          const userCard = await cardIntegration.createUser({
            name: account.personalData?.name ?? user.personalData.name,
            surname:
              account.personalData?.lastName ?? user.personalData.lastName,
            identification_type:
              account.personalData?.typeDocId ?? user.personalData.typeDocId,
            identification_value:
              account.personalData?.numDocId ??
              user.personalData.numDocId?.toString(),
            birthdate: `${birthDate.getFullYear()}-${CommonService.getNumberDigits(
              birthDate.getMonth() + 1,
              2,
            )}-${birthDate.getDate()}`,
            gender: account.personalData?.gender ?? user.personalData.gender,
            email: account.email ?? user.personalData.email[0] ?? user.email,
            phone: account.telephone ?? user.personalData.telephone[0],
            tax_identification_type:
              account.personalData?.taxIdentificationType ??
              user.personalData.taxIdentificationType,
            tax_identification_value:
              account.personalData?.taxIdentificationValue ??
              user.personalData.taxIdentificationValue,
            nationality:
              account.personalData?.nationality ??
              user.personalData.nationality,
            legal_address:
              account.personalData?.location.address ??
              user.personalData.location.address,
            operation_country: account.country ?? user.personalData.nationality,
          } as unknown as UserCardDto);
          const error = userCard['error'];
          if (error) {
            throw new BadRequestException(error);
          }
          account.userCardConfig = userCard.data as unknown as UserCard;
        }
        await this.userService.updateUser({
          id: user._id,
          userCard: account.userCardConfig,
        });
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

  @Post('recharge')
  async rechargeOne(@Body() createDto: CardDepositCreateDto, @Req() req?: any) {
    const user: User = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: {
          _id: req?.user.id,
        },
      })
    ).list[0];
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
      createDto.id.toString(),
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
      throw new BadRequestException('Wallet is not valid1');
    }
    if (from.amount < createDto.amount) {
      throw new BadRequestException('Wallet with enough balance');
    }
    return Promise.all([
      this.cardService.customUpdateOne({
        id: createDto.id,
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

  @EventPattern(EventsNamesAccountEnum.updateAmount)
  async updateAmount(
    @Ctx() ctx: RmqContext,
    @Payload() data: CardDepositCreateDto,
  ) {
    CommonService.ack(ctx);
    const cardList = await this.cardService.findAll({
      where: {
        accountId: data.id,
      },
    });
    const card = cardList.list[0];
    if (!card) {
      throw new BadRequestException('Card not found');
    }
    const amount =
      data.movement == 'debit' ? data.amount ?? 0 : data.amount ?? 0;
    await this.cardService.customUpdateOne({
      id: card._id,
      $inc: {
        amount: amount,
      },
    });
  }

  @MessagePattern(EventsNamesAccountEnum.athorizationTx)
  async authorizationTx(
    @Ctx() ctx: RmqContext,
    @Payload() data: TransferUpdateDto,
  ) {
    CommonService.ack(ctx);
    Logger.log(`Looking for card: ${data.id}`, 'CardController');
    const cardList = await this.cardService.findAll({
      where: {
        'cardConfig.id': `${data.id}`,
      },
    });
    const card = cardList.list[0];
    if (!card) {
      throw new BadRequestException('Card not found');
    }
    Logger.log(
      `Card balance: ${card.amount} | Movement amount: ${data.amount}`,
      'CardController',
    );
    const allowedBalance = card.amount * (1.0 - this.BLOCK_BALANCE_PERCENTAGE);
    if (allowedBalance <= data.amount) {
      throw new BadRequestException('Not enough balance');
    }
    await this.cardService.customUpdateOne({
      id: card._id,
      $inc: {
        amount: data.amount * -1,
      },
    });
  }
}
