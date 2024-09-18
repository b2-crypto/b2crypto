import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { User } from '@user/user/entities/mongoose/user.schema';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { AccountServiceService } from './account-service.service';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import EventsNamesAccountEnum from './enum/events.names.account.enum';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';

@Injectable()
export class WalletServiceService {
  constructor(
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(AccountServiceService)
    private readonly accountService: AccountServiceService,
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
  ) {}

  async createWallet(createDto: WalletCreateDto, userId?: string): Promise<any> {
    userId = userId ?? createDto.owner;
    if (!userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user: User = (await this.userService.getAll({
      relations: ['personalData'],
      where: { _id: userId },
    })).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    createDto.type = TypesAccountEnum.WALLET;
    createDto.accountId = '2177';
    createDto.accountName = 'CoxSQtiWAHVo';
    createDto.accountPassword = 'w7XDOfgfudBvRG';
    createDto.owner = user.id ?? user._id;
    createDto.pin = createDto.pin ?? parseInt(CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4));

    const createdWallet = await this.accountService.createOne(createDto);

    const emailData = {
      destinyText: user.email,
      vars: {
        name: user.name,
        accountType: createdWallet.accountType,
        accountName: createdWallet.accountName,
        balance: createdWallet.amount,
        currency: createdWallet.currency,
        accountId: createdWallet.accountId,
      },
    };

    const transferBtn: TransferCreateButtonDto = {
      amount: '999',
      currency: 'USD',
      account: createdWallet.id ?? createdWallet._id,
      creator: createDto.owner,
      details: 'Deposit address',
      customer_name: user.name,
      customer_email: user.email,
      public_key: null,
      identifier: createDto.owner,
    };

    this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData
    );

    if (process.env.ENVIRONMENT === EnvironmentEnum.prod) {
      this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: createdWallet.id ?? createdWallet._id,
          responseCreation: await this.ewalletBuilder.getPromiseTransferEventClient(
            EventsNamesTransferEnum.createOneDepositLink,
            transferBtn
          ),
        }
      );
    }

    return createdWallet;
  }
}
