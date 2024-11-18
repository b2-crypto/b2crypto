import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { CategoryServiceService } from "apps/category-service/src/category-service.service";
import { GroupServiceService } from "apps/group-service/src/group-service.service";
import { StatusServiceService } from "apps/status-service/src/status-service.service";
import { AfgNamesEnum } from "../enum/afg.names.enum";
import { CommonService } from "@common/common";
import ResourcesEnum from "@common/common/enums/ResourceEnum";
import TagEnum from "@common/common/enums/TagEnum";

interface AfgConfig {
    id: string;
    name: string;
    card_type_supported: string[];
    innominate: boolean;
    months_to_expiration: number;
    issued_account: number;
    fee_account: number;
    exchange_rate_type: string;
    exchange_rate_amount: number;
    non_usd_exchange_rate_amount: number;
    dcc_exchange_rate_amount: number;
    local_withdrawal_allowed: boolean;
    international_withdrawal_allowed: boolean;
    local_ecommerce_allowed: boolean;
    international_ecommerce_allowed: boolean;
    local_purchases_allowed: boolean;
    international_purchases_allowed: boolean;
    product_id: string;
    local_extracash_allowed: boolean;
    international_extracash_allowed: boolean;
    plastic_model: number;
    kit_model: number;
    status: string;
    embossing_company: string;
    courier_company: string;
    exchange_currency_name: string;
    activation_code_enabled: boolean;
    total_exchange_rate: number;
    total_non_usd_exchange_rate: number;
    total_dcc_exchange_rate: number;
    provider: string;
    custom_name_on_card_enabled: boolean;
    provider_algorithm: string;
    start_date: string;
    dcvv_enabled: boolean;
}

interface StatusResponse {
    totalElements: number;
    list: Array<{ _id: string }>;
}

@Injectable()
export class CardAfgService {
    constructor(
        private readonly groupService: GroupServiceService,
        private readonly categoryService: CategoryServiceService,
        private readonly statusService: StatusServiceService,
    ) { }

    getAfgByLevel(levelSlug: string, cardPhysical = false): AfgNamesEnum {
        const map = cardPhysical
            ? {
                'grupo-0': AfgNamesEnum.NA,
                'grupo-1': AfgNamesEnum.CONSUMER_NOMINADA_3K,
                'grupo-2': AfgNamesEnum.CONSUMER_NOMINADA_10K,
                'grupo-3': AfgNamesEnum.CONSUMER_INNOMINADA_25K,
                'grupo-4': AfgNamesEnum.CONSUMER_INNOMINADA_100K,
            }
            : {
                'grupo-0': AfgNamesEnum.CONSUMER_VIRTUAL_1K,
                'grupo-1': AfgNamesEnum.CONSUMER_VIRTUAL_1K,
                'grupo-2': AfgNamesEnum.CONSUMER_VIRTUAL_2K,
                'grupo-3': AfgNamesEnum.CONSUMER_VIRTUAL_5K,
                'grupo-4': AfgNamesEnum.CONSUMER_VIRTUAL_10K,
            };

        return map[levelSlug] ?? (() => {
            throw new BadRequestException(`Wrong level ${levelSlug}`);
        })();
    }

    async buildAFG(
        afgId?: string,
        cardAfg: AfgNamesEnum = AfgNamesEnum.CONSUMER_VIRTUAL_1K,
    ) {
        let afg: AfgConfig = process.env.ENVIRONMENT === 'PROD'
            ? this.getAfgProd(cardAfg)
            : this.getAfgStage(cardAfg);

        Logger.debug(
            `AFG: ${JSON.stringify(afg)}`,
            'CardAfgService.buildAFG',
        );

        if (afgId) {
            afg = this.buildMigrationAfg(afgId);
        }

        return await this.createOrGetAfgGroup(afg);
    }

    private buildMigrationAfg(afgId: string): AfgConfig {
        return {
            id: afgId ?? 'afg-2arMn990ZksFKAHS5PngRPHqRmS',
            name: afgId ? 'migration' : 'B2Crypto COL physical virtual credit nominated',
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
    }

    private getAfgProd(cardAfg: AfgNamesEnum): AfgConfig {
        let afg: AfgConfig = {
            id: 'afg-2lZYP9KVezJJcvSKCkAMbNPOolq',
            name: 'Consumer-Virtual-1k',
            card_type_supported: ['VIRTUAL'],
            innominate: false,
            months_to_expiration: 96,
            issued_account: 9,
            fee_account: 36,
            exchange_rate_type: 'none',
            exchange_rate_amount: 0,
            non_usd_exchange_rate_amount: 0,
            dcc_exchange_rate_amount: 0,
            local_withdrawal_allowed: true,
            international_withdrawal_allowed: true,
            local_ecommerce_allowed: true,
            international_ecommerce_allowed: true,
            local_purchases_allowed: true,
            international_purchases_allowed: true,
            product_id: 'prd-2dK0YVgQ2DnpvfNcq8pmdNnwz0I',
            local_extracash_allowed: true,
            international_extracash_allowed: true,
            plastic_model: 1,
            kit_model: 1,
            status: 'ACTIVE',
            embossing_company: 'IDEMIA',
            courier_company: 'DOMINA',
            exchange_currency_name: 'COP',
            activation_code_enabled: false,
            total_exchange_rate: 4149.79,
            total_non_usd_exchange_rate: 4149.79,
            total_dcc_exchange_rate: 4149.79,
            provider: 'MASTERCARD',
            custom_name_on_card_enabled: false,
            provider_algorithm: 'MCHIP',
            start_date: '2024-09-03',
            dcvv_enabled: false,
        };

        switch (cardAfg) {
            case AfgNamesEnum.CONSUMER_NOMINADA_3K:
                afg = {
                    id: 'afg-2fdxV2deQc0qHDbTtCwOlbFZJBL',
                    name: 'B2Crypto COL physical credit nominated',
                    card_type_supported: ['PHYSICAL'],
                    innominate: false,
                    months_to_expiration: 96,
                    issued_account: 9,
                    fee_account: 36,
                    exchange_rate_type: '100',
                    exchange_rate_amount: 100,
                    non_usd_exchange_rate_amount: 100,
                    dcc_exchange_rate_amount: 0,
                    local_withdrawal_allowed: true,
                    international_withdrawal_allowed: true,
                    local_ecommerce_allowed: true,
                    international_ecommerce_allowed: true,
                    local_purchases_allowed: true,
                    international_purchases_allowed: true,
                    product_id: 'prd-2fdxUv6l6VEVxlgOxt2UGCCUZXs',
                    local_extracash_allowed: true,
                    international_extracash_allowed: true,
                    plastic_model: 1,
                    kit_model: 1,
                    status: 'ACTIVE',
                    embossing_company: 'IDEMIA',
                    courier_company: 'DOMINA',
                    exchange_currency_name: 'COP',
                    activation_code_enabled: false,
                    total_exchange_rate: 4169.8,
                    total_non_usd_exchange_rate: 4169.8,
                    total_dcc_exchange_rate: 4128.51,
                    provider: 'MASTERCARD',
                    custom_name_on_card_enabled: false,
                    provider_algorithm: 'MCHIP',
                    start_date: '2024-04-26',
                    dcvv_enabled: false,
                };
                break;
        }
        return afg;
    }

    private getAfgStage(cardAfg: AfgNamesEnum): AfgConfig {
        let afg: AfgConfig = {
            id: 'afg-2VtGPHue8VIrXsJa0H7OzLLri4T',
            name: 'Afinidad basica 2',
            card_type_supported: ['VIRTUAL', 'PHYSICAL'],
            innominate: false,
            months_to_expiration: 96,
            issued_account: 9,
            fee_account: 36,
            exchange_rate_type: 'none',
            exchange_rate_amount: 0,
            non_usd_exchange_rate_amount: 0,
            dcc_exchange_rate_amount: 0,
            local_withdrawal_allowed: false,
            international_withdrawal_allowed: false,
            local_ecommerce_allowed: true,
            international_ecommerce_allowed: true,
            local_purchases_allowed: true,
            international_purchases_allowed: true,
            product_id: 'prd-2VtGP4RvXv5enzWYe2jikrxucrG',
            local_extracash_allowed: true,
            international_extracash_allowed: true,
            plastic_model: 1,
            kit_model: 1,
            status: 'ACTIVE',
            embossing_company: 'THALES',
            courier_company: 'ESTAFETA',
            exchange_currency_name: 'MXN',
            activation_code_enabled: false,
            total_exchange_rate: 20.6,
            total_non_usd_exchange_rate: 20.6,
            total_dcc_exchange_rate: 20.6,
            provider: 'MASTERCARD',
            custom_name_on_card_enabled: false,
            provider_algorithm: 'EMV_CSKD',
            start_date: '2023-09-25',
            dcvv_enabled: false,
        };

        switch (cardAfg) {
            case AfgNamesEnum.CONSUMER_NOMINADA_3K:
            case AfgNamesEnum.CONSUMER_NOMINADA_10K:
            case AfgNamesEnum.CONSUMER_NOMINADA_25K:
            case AfgNamesEnum.CONSUMER_NOMINADA_100K:
                afg = {
                    id: 'afg-2fdxV2deQc0qHDbTtCwOlbFZJBL',
                    name: 'B2Crypto COL physical credit nominated',
                    card_type_supported: ['PHYSICAL'],
                    innominate: false,
                    months_to_expiration: 96,
                    issued_account: 9,
                    fee_account: 36,
                    exchange_rate_type: '100',
                    exchange_rate_amount: 100,
                    non_usd_exchange_rate_amount: 100,
                    dcc_exchange_rate_amount: 0,
                    local_withdrawal_allowed: true,
                    international_withdrawal_allowed: true,
                    local_ecommerce_allowed: true,
                    international_ecommerce_allowed: true,
                    local_purchases_allowed: true,
                    international_purchases_allowed: true,
                    product_id: 'prd-2fdxUv6l6VEVxlgOxt2UGCCUZXs',
                    local_extracash_allowed: true,
                    international_extracash_allowed: true,
                    plastic_model: 1,
                    kit_model: 1,
                    status: 'ACTIVE',
                    embossing_company: 'IDEMIA',
                    courier_company: 'DOMINA',
                    exchange_currency_name: 'COP',
                    activation_code_enabled: false,
                    total_exchange_rate: 4169.8,
                    total_non_usd_exchange_rate: 4169.8,
                    total_dcc_exchange_rate: 4128.51,
                    provider: 'MASTERCARD',
                    custom_name_on_card_enabled: false,
                    provider_algorithm: 'MCHIP',
                    start_date: '2024-04-26',
                    dcvv_enabled: false,
                };
                break;
        }
        return afg;
    }

    private async createOrGetAfgGroup(afg: AfgConfig) {
        const group = await this.groupService.getAll({
            where: {
                slug: CommonService.getSlug(afg.name),
            },
        });

        if (group.totalElements >= 1) {
            return group;
        }

        const categoryAffinityGroup = await this.getOrCreateAffinityGroupCategory();
        const statusActive = await this.getActiveStatus();

        group.list.push(
            await this.groupService.newGroup({
                name: afg.name,
                valueGroup: afg.id,
                status: statusActive.list[0]?._id,
                category: categoryAffinityGroup._id,
            }),
        );

        return group;
    }

    private async getOrCreateAffinityGroupCategory() {
        const categoryAffinityGroupList = await this.categoryService.getAll({
            where: { slug: 'affinity-group' },
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

        return categoryAffinityGroupList.list[0];
    }

    private async getActiveStatus(): Promise<StatusResponse> {
        const statusActive = await this.statusService.getAll({
            where: { slug: 'active' },
        });

        if (!statusActive.totalElements) {
            throw new BadRequestException('Status active not found');
        }

        return statusActive;
    }
}