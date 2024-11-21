import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountServiceService } from '../account-service.service';
import { BuildersService } from '@builder/builders';
import { IntegrationService } from '@integration/integration';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { CommonService } from '@common/common';
import { WalletBaseService } from './WalletBaseService';
import { WalletNotificationService } from './WalletNotificationService';

@Injectable()
export class WalletFireblocksService {
    private cryptoType = null;

    constructor(
        @Inject(AccountServiceService)
        private readonly accountService: AccountServiceService,
        @Inject(WalletBaseService)
        private readonly baseService: WalletBaseService,
        @Inject(WalletNotificationService)
        private readonly notificationService: WalletNotificationService,
        @Inject(BuildersService)
        private readonly ewalletBuilder: BuildersService,
        private readonly integration: IntegrationService,
    ) { }

    async createWalletFireblocks(createDto: WalletCreateDto, userId: string): Promise<any> {
        if (!userId) {
            throw new BadRequestException('Need the user id to continue');
        }

        const user = await this.baseService.getUser(userId);
        const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
            EventsNamesCrmEnum.findOneByName,
            IntegrationCryptoEnum.FIREBLOCKS,
        );

        const walletBase = await this.getWalletBase(fireblocksCrm._id, createDto.name);

        if (process.env.ENVIRONMENT === EnvironmentEnum.prod) {
            const vaultUser = await this.getVaultUser(
                userId,
                fireblocksCrm._id,
                walletBase,
                createDto.brand,
            );

            const walletData = {
                ...createDto,
                type: TypesAccountEnum.WALLET,
                accountName: walletBase.accountName,
                nativeAccountName: walletBase.nativeAccountName,
                accountId: walletBase.accountId,
                crm: fireblocksCrm,
                owner: user.id ?? user._id,
            };

            const createdWallet = await this.getWalletUser(
                walletData,
                userId,
                fireblocksCrm._id,
                vaultUser,
            );

            await this.notificationService.sendNotification(createdWallet, user);
            return createdWallet;
        }

        throw new BadRequestException('Only work in Prod');
    }

    async getFireblocksType() {
        if (!this.cryptoType) {
            this.cryptoType = this.integration.getCryptoIntegration(
                null,
                IntegrationCryptoEnum.FIREBLOCKS,
                '',
            );
        }
        return this.cryptoType;
    }

    async getWalletBase(fireblocksCrmId: string, nameWallet: string) {
        const walletBase = (
            await this.accountService.availableWalletsFireblocks({
                where: {
                    crm: fireblocksCrmId,
                    name: nameWallet,
                    showToOwner: false,
                    owner: { $exists: false },
                },
            })
        ).list[0];

        if (!walletBase) {
            throw new BadRequestException(`The wallet ${nameWallet} is not available`);
        }
        return walletBase;
    }

    async getWallet(
        walletBase: any,
        fireblocksCrm: any,
        vault: any,
        type: WalletTypesAccountEnum = WalletTypesAccountEnum.VAULT,
    ) {
        const dtoWallet = new WalletCreateDto();
        dtoWallet.name = walletBase.name;
        dtoWallet.type = TypesAccountEnum.WALLET;
        dtoWallet.accountType = WalletTypesAccountEnum.VAULT_W;
        dtoWallet.accountName = walletBase.accountName;
        dtoWallet.nativeAccountName = walletBase.nativeAccountName;
        dtoWallet.accountId = walletBase.accountId;
        dtoWallet.crm = fireblocksCrm;
        dtoWallet.owner = vault.owner;

        return this.getWalletBrand(
            dtoWallet,
            fireblocksCrm._id,
            vault,
            String(vault.brand),
            type,
        );
    }

    async getWalletBrand(
        dtoWallet: WalletCreateDto,
        fireblocksCrmId: string,
        vaultBrand: any,
        brandId: string,
        accountType = WalletTypesAccountEnum.VAULT,
    ) {
        const walletName = `${dtoWallet.name}-${brandId}-${accountType}`;
        const walletUser = (
            await this.accountService.findAll({
                where: {
                    name: walletName,
                    type: TypesAccountEnum.WALLET,
                    accountType,
                    crm: fireblocksCrmId,
                    showToOwner: true,
                    brand: dtoWallet.brand,
                    referral: vaultBrand.id,
                },
            })
        ).list[0];

        if (!walletUser) {
            const cryptoType = await this.getFireblocksType();
            const newWallet = await cryptoType.createWallet(
                vaultBrand.accountId,
                dtoWallet.accountId,
            );
            if (!newWallet) {
                throw new BadRequestException('Error creating new wallet');
            }

            return await this.accountService.createOne({
                ...dtoWallet,
                responseCreation: newWallet,
                showToOwner: true,
                brand: brandId,
                accountName: newWallet.address,
                pin: CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
                accountType: WalletTypesAccountEnum.VAULT,
            });
        }

        return walletUser;
    }

    async getVaultUser(userId: string, fireblocksCrmId: string, walletBase: any, brandId: string) {
        const vaultUserList = await this.accountService.findAll({
            where: {
                name: `${userId}-vault`,
                accountType: WalletTypesAccountEnum.VAULT,
                crm: fireblocksCrmId,
                showToOwner: false,
                owner: userId,
            },
        });

        if (!vaultUserList.list[0]) {
            const cryptoType = await this.getFireblocksType();
            const newVault = await cryptoType.createVault(`${userId}-vault`);
            return await this.accountService.createOne({
                name: `${userId}-vault`,
                slug: `${userId}-vault`,
                owner: userId,
                accountType: WalletTypesAccountEnum.VAULT,
                crm: fireblocksCrmId,
                accountId: newVault.id,
                accountName: walletBase.accountName,
                showToOwner: false,
                pin: CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
                responseCreation: newVault,
                type: TypesAccountEnum.WALLET,
                decimals: walletBase.decimals,
                referral: walletBase.referral,
                protocol: walletBase.protocol,
                brand: brandId,
                statusText: StatusAccountEnum.VISIBLE,
                currency: CurrencyCodeB2cryptoEnum.USDT,
                currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
                id: undefined,
                searchText: '',
                docId: '',
                secret: '',
                address: null,
                email: '',
                telephone: '',
                description: '',
                hasSendDisclaimer: false,
                totalTransfer: 0,
                quantityTransfer: 0,
                accountStatus: [],
                createdAt: undefined,
                updatedAt: undefined,
                cardConfig: undefined,
                amount: 0,
                amountCustodial: 0,
                amountBlocked: 0,
                currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
                amountBlockedCustodial: 0,
                currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
                afgId: ''
            });
        }

        return vaultUserList.list[0];
    }

    private async getWalletUser(dtoWallet: WalletCreateDto, userId: string, fireblocksCrmId: string, vaultUser: any) {
        const walletName = `${dtoWallet.name}-${userId}`;
        const existingWallet = (await this.accountService.findAll({
            where: {
                name: walletName,
                owner: userId,
                accountType: WalletTypesAccountEnum.VAULT,
                crm: fireblocksCrmId,
                showToOwner: true,
                brand: dtoWallet.brand,
                referral: vaultUser.id,
            },
        })).list[0];

        if (!existingWallet) {
            const cryptoType = await this.getFireblocksType();
            const newWallet = await cryptoType.createWallet(vaultUser.accountId, dtoWallet.accountId);
            if (!newWallet) throw new BadRequestException('Error creating new wallet');

            return await this.accountService.createOne({
                ...dtoWallet,
                responseCreation: newWallet,
                showToOwner: true,
                accountName: newWallet.address,
                accountType: WalletTypesAccountEnum.VAULT,
            });
        }
        return existingWallet;
    }

    async getVaultBrand(
        fireblocksCrmId: string,
        walletBase: any,
        brandId: string,
        accountType = WalletTypesAccountEnum.VAULT,
    ) {
        const vaultName = `${brandId}-vault-${accountType}`;
        const vaultBrand = (
            await this.accountService.findAll({
                where: {
                    name: vaultName,
                    brand: brandId,
                    type: TypesAccountEnum.WALLET,
                    accountType,
                    crm: fireblocksCrmId,
                    showToOwner: false,
                    owner: { $exists: false },
                },
            })
        ).list[0];

        if (!vaultBrand) {
            const cryptoType = await this.getFireblocksType();
            const newVault = await cryptoType.createVault(vaultName);
            return await this.accountService.createOne({
                name: vaultName,
                slug: `${brandId}-vault`,
                owner: undefined,
                accountType,
                crm: fireblocksCrmId,
                accountId: newVault.id,
                accountName: walletBase.accountName,
                showToOwner: false,
                pin: CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4),
                responseCreation: newVault,
                type: TypesAccountEnum.WALLET,
                decimals: walletBase.decimals,
                referral: walletBase.referral,
                protocol: walletBase.protocol,
                brand: brandId,
                statusText: StatusAccountEnum.HIDDEN,
                currency: CurrencyCodeB2cryptoEnum.USDT,
                currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
                id: undefined,
                searchText: '',
                docId: '',
                secret: '',
                address: null,
                email: '',
                telephone: '',
                description: '',
                hasSendDisclaimer: false,
                totalTransfer: 0,
                quantityTransfer: 0,
                accountStatus: [],
                createdAt: undefined,
                updatedAt: undefined,
                cardConfig: undefined,
                amount: 0,
                amountCustodial: 0,
                amountBlocked: 0,
                currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
                amountBlockedCustodial: 0,
                currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
                afgId: ''
            });
        }

        return vaultBrand;
    }
}