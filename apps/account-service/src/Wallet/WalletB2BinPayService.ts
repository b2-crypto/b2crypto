import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountServiceService } from '../account-service.service';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { CommonService } from '@common/common';
import { WalletBaseService } from './WalletBaseService';
import { WalletNotificationService } from './WalletNotificationService';

@Injectable()
export class WalletB2BinPayService {
    constructor(
        @Inject(AccountServiceService)
        private readonly accountService: AccountServiceService,
        @Inject(WalletBaseService)
        private readonly baseService: WalletBaseService,
        @Inject(WalletNotificationService)
        private readonly notificationService: WalletNotificationService,
    ) { }

    async createWalletB2BinPay(createDto: WalletCreateDto, userId?: string): Promise<any> {
        const effectiveUserId = userId ?? createDto.owner;
        if (!effectiveUserId) {
            throw new BadRequestException('Need the user id to continue');
        }

        const user = await this.baseService.getUser(effectiveUserId);

        const walletData: WalletCreateDto = {
            ...createDto,
            type: TypesAccountEnum.WALLET,
            accountId: '2177',
            accountName: 'CoxSQtiWAHVo',
            accountPassword: 'w7XDOfgfudBvRG',
            owner: user.id ?? user._id,
            pin: createDto.pin ?? CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4)
        };

        const createdWallet = await this.accountService.createOne(walletData);
        await this.notificationService.sendNotification(createdWallet, user);
        return createdWallet;
    }
}