import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Inject,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from '@user/user/entities/mongoose/user.schema';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceController } from './account-service.controller';
import { AccountServiceService } from './account-service.service';
import { RechargeCreateDto } from '@account/account/dto/recharge.create.dto';

@ApiTags('E-WALLET')
@Controller('wallets')
export class WalletServiceController extends AccountServiceController {
  constructor(
    readonly ewalletService: AccountServiceService,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(BuildersService)
    readonly ewalletBuilder: BuildersService,
  ) {
    super(ewalletService, ewalletBuilder);
  }
  @Post('create')
  async createOne(@Body() createDto: WalletCreateDto, @Req() req?: any) {
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
    return this.ewalletService.createOne(createDto);
  }

  @Post('recharge')
  async rechargeOne(@Body() createDto: RechargeCreateDto, @Req() req?: any) {
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
    return this.ewalletService.updateOne(createDto);
  }

  @Delete(':walletID')
  deleteOneById(@Param('walletID') id: string, req?: any) {
    return this.getAccountService().deleteOneById(id);
  }
}
