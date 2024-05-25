import { CardCreateDto } from '@account/account/dto/card.create.dto';
import { Card } from '@account/account/entities/mongoose/card.schema';
import { UserCard } from '@account/account/entities/mongoose/user-card.schema';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import ResourcesEnum from '@common/common/enums/ResourceEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { IntegrationService } from '@integration/integration';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { UserCardDto } from '@integration/integration/card/generic/dto/user.card.dto';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Inject,
  Logger,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@user/user/entities/mongoose/user.schema';
import { CategoryServiceService } from 'apps/category-service/src/category-service.service';
import { GroupServiceService } from 'apps/group-service/src/group-service.service';
import { StatusServiceService } from 'apps/status-service/src/status-service.service';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';

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
  ) {
    super(cardService, cardBuilder);
  }
  @Post('create')
  async createOne(@Body() createDto: CardCreateDto, @Req() req?: any) {
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
            email: account.email ?? user.personalData.email[0],
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
      // Validate Affinity Group
      if (!account?.group?.valueGroup) {
        const affinityGroup = await cardIntegration.getAffinityGroup(
          account.userCardConfig,
        );
        const afg = affinityGroup.data[0];
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
        card_type: account.type,
        email: account.email,
        address: {
          street_name: user.personalData.location.address.street_name,
          street_number: user.personalData.location.address.street_number,
          floor: user.personalData.location.address.floor,
          apartment: user.personalData.location.address.apartment,
          city: user.personalData.location.address.city,
          region: user.personalData.location.address.region,
          country: 'Colombia',
          zip_code: user.personalData.location.zipcode,
          neighborhood: user.personalData.location.address.neighborhood,
        },
        /* account.personalData?.location.address ??
          user.personalData.location.address, */
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
  @Delete(':cardID')
  deleteOneById(@Param('cardID') id: string, req?: any) {
    return this.getAccountService().deleteOneById(id);
  }
}
