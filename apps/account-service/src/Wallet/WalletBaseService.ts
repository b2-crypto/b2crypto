import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { AccountServiceService } from '../account-service.service';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { User } from '@user/user/entities/mongoose/user.schema';
import { CommonService } from '@common/common';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import { BuildersService } from '@builder/builders';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';

@Injectable()
export class WalletBaseService {
    constructor(
        @Inject(AccountServiceService)
        private readonly accountService: AccountServiceService,
        @Inject(UserServiceService)
        private readonly userService: UserServiceService,
        @Inject(BuildersService)
        private readonly ewalletBuilder: BuildersService,
    ) { }

    async createWallet(createDto: WalletCreateDto, userId?: string): Promise<any> {
        const effectiveUserId = userId ?? createDto.owner;
        if (!effectiveUserId) {
            throw new BadRequestException('Need the user id to continue');
        }

        const user = await this.getUser(effectiveUserId);
        const walletData: WalletCreateDto = {
            ...createDto,
            type: TypesAccountEnum.WALLET,
            accountId: '2177',
            accountName: 'CoxSQtiWAHVo',
            accountPassword: 'w7XDOfgfudBvRG',
            owner: user.id ?? user._id,
            pin: createDto.pin ?? CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4)
        };

        return await this.accountService.createOne(walletData);
    }

    async updateStatusAccount(id: string, slugName: StatusAccountEnum) {
        const account = await this.accountService.findOneById(id);
        const status = await this.ewalletBuilder.getPromiseStatusEventClient(
            EventsNamesStatusEnum.findOneByName,
            slugName,
        );
        account.status = status;
        account.statusText = slugName;
        return account.save();
    }

    async toggleVisibleToOwner(id: string, visible?: boolean) {
        const account = await this.accountService.findOneById(id);
        account.showToOwner = visible ?? !account.showToOwner;
        return account.save();
    }

    async getUser(userId: string): Promise<User> {
        const userResponse = await this.userService.getAll({
            relations: ['personalData'],
            where: { _id: userId },
        });

        if (!userResponse?.list?.length) {
            throw new BadRequestException('User not found');
        }

        const user = userResponse.list[0];
        if (!user.personalData) {
            throw new BadRequestException('Need the personal data to continue');
        }

        return user;
    }

    async getWalletByIdAndValidate(id: string, checkOwner?: string): Promise<any> {
        const wallet = await this.accountService.findOneById(id);
        if (!wallet || wallet.type !== TypesAccountEnum.WALLET) {
            throw new BadRequestException('Wallet not found');
        }
        if (checkOwner && wallet.owner.toString() !== checkOwner) {
            throw new BadRequestException('Unauthorized wallet access');
        }
        return wallet;
    }
}