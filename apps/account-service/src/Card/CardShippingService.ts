import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { IntegrationService } from '@integration/integration';
import { AccountServiceService } from '../account-service.service';
import { User } from '@user/user/entities/mongoose/user.schema';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { ShippingDto } from '@integration/integration/card/generic/dto/shipping.dto';
import { AddressSchema } from '@person/person/entities/mongoose/address.schema';

interface BaseShippingAddress {
    street_name: string;
    street_number: string;
    city: string;
    region: string;
    country: string;
    neighborhood: string;
    zip_code?: string;
    floor?: string;
    apartment: string;
    additional_info: string;
}

interface ShippingAddress extends Required<BaseShippingAddress> {
    additional_info: string;
}

interface ApiShippingResult {
    id: string;
    address: ShippingAddress;
}

interface ApiShippingResponse {
    data: ApiShippingResult;
}

interface ShippingAccountData extends Omit<AccountCreateDto, 'address'> {
    responseShipping: ApiShippingResult;
    address: AddressSchema;
}

@Injectable()
export class CardShippingService {
    constructor(
        private readonly accountService: AccountServiceService,
        private readonly integration: IntegrationService,
    ) { }

    public async getShippingPhysicalCard(cardId: string, user: User): Promise<ApiShippingResult> {
        const card = await this.accountService.findOneById(cardId);
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

        const rtaGetShipping = await cardIntegration.getShippingPhysicalCard(
            card.responseShipping.id,
        );
        Logger.log(rtaGetShipping, 'Shipping');
        return card.responseShipping;
    }

    async shippingPhysicalCard(user: User) {
        if (!user.personalData?.location?.address) {
            throw new BadRequestException('Location address not found');
        }

        const physicalCardPending = await this.accountService.findAll({
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

        const cardIntegration = await this.getCardIntegrationWithUser(user);
        const shippingRequest = this.buildShippingRequest(user);
        const response = await cardIntegration.shippingPhysicalCard(shippingRequest);

        if (response?.data?.id) {
            return await this.createShippingAccount(user, response as ApiShippingResponse);
        }

        throw new BadRequestException('Shipment was not created');
    }

    private buildShippingRequest(user: User): ShippingDto {
        const address = this.buildShippingAddress(user.personalData.location.address);
        return {
            shipment_type: 'CARD_FROM_WAREHOUSE',
            affinity_group_id: 'afg-2jc1143Egwfm4SUOaAwBz9IfZKb',
            country: 'COL',
            user_id: user.userCard.id,
            address,
            receiver: {
                full_name: user.personalData.name,
                email: user.email,
                document_type: user.personalData.typeDocId,
                document_number: user.personalData.numDocId,
                telephone_number: user.personalData.telephones[0]?.phoneNumber ?? user.personalData.phoneNumber,
            },
        };
    }

    private buildShippingAddress(address: AddressSchema): ShippingAddress {
        if (!address.street_name || !address.city || !address.region) {
            throw new BadRequestException('Incomplete address information');
        }

        return {
            street_name: address.street_name,
            street_number: ' ',
            apartment: address.apartment || ' ',
            city: address.city,
            region: address.region,
            country: address.country || 'COL',
            neighborhood: address.neighborhood || ' ',
            zip_code: address.zip_code || ' ',
            floor: address.floor || ' ',
            additional_info: address.additional_info || ' ',
        };
    }

    private async getCardIntegrationWithUser(user: User) {
        const cardIntegration = await this.integration.getCardIntegration(
            IntegrationCardEnum.POMELO,
        );
        if (!cardIntegration) {
            throw new BadRequestException('Bad integration card');
        }

        if (!user.userCard) {
            throw new BadRequestException('User card configuration not found');
        }

        return cardIntegration;
    }

    private async createShippingAccount(user: User, shippingResponse: ApiShippingResponse) {
        const accountData: ShippingAccountData = {
            type: TypesAccountEnum.CARD,
            accountType: CardTypesAccountEnum.PHYSICAL,
            responseShipping: shippingResponse.data,
            address: this.buildShippingAccountAddress(shippingResponse.data.address),
            personalData: user.personalData,
            owner: user._id ?? user.id,
            name: '',
            currency: CurrencyCodeB2cryptoEnum.USD,
            currencyCustodial: CurrencyCodeB2cryptoEnum.USD,
            statusText: StatusAccountEnum.VISIBLE,
            showToOwner: false,
            slug: '',
            searchText: '',
            docId: '',
            secret: '',
            pin: '',
            email: '',
            telephone: '',
            description: '',
            decimals: 0,
            hasSendDisclaimer: false,
            totalTransfer: 0,
            quantityTransfer: 0,
            accountStatus: [],
            cardConfig: undefined,
            amount: 0,
            amountCustodial: 0,
            amountBlocked: 0,
            currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
            amountBlockedCustodial: 0,
            currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
            afgId: '',
            id: undefined,
            createdAt: undefined,
            updatedAt: undefined
        };

        return await this.accountService.createOne(accountData);
    }

    private buildShippingAccountAddress(address: ShippingAddress): AddressSchema {
        return {
            street_name: address.street_name,
            street_number: address.street_number,
            city: address.city,
            region: address.region,
            country: address.country,
            neighborhood: address.neighborhood,
            apartment: address.apartment,
            floor: address.floor,
            zip_code: address.zip_code,
            additional_info: address.additional_info,
            name: address.street_name,
            slug: `${address.street_name}-${address.city}`,
            description: `${address.street_name}, ${address.city}, ${address.region}`,
            searchText: `${address.street_name} ${address.city} ${address.region}`
        };
    }
}