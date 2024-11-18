
import { User } from '@user/user/entities/mongoose/user.schema';
import { AccountServiceService } from '../account-service.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import StatusAccountEnum from '@account/account/enum/status.account.enum';

@Injectable()
export class CardValidationService {
    constructor(private readonly accountService: AccountServiceService) { }

    async validatePhysicalCard() {
        const physicalCards = await this.accountService.findAll({
            take: 1,
            where: { statusText: StatusAccountEnum.ORDERED },
        });

        if (physicalCards.totalElements > 0) {
            throw new BadRequestException('Already physical card ordered');
        }
    }

    validateUserProfile(user: User) {
        if (!user.personalData) {
            throw new BadRequestException('Need the personal data to continue');
        }

        if (!user.personalData.location?.address) {
            throw new BadRequestException('Location address not found');
        }
    }
}
