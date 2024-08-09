import CardTypesAccountEnum from '@account/account/enum/card.types.account.enum';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import DocIdTypeEnum from '@common/common/enums/DocIdTypeEnum';
import GenderEnum from '@common/common/enums/GenderEnum';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import { IntegrationService } from '@integration/integration';
import IntegrationCardEnum from '@integration/integration/card/enums/IntegrationCardEnum';
import { CardSearchDto } from '@integration/integration/card/generic/dto/card.dto';
import { IntegrationCardService } from '@integration/integration/card/generic/integration.card.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import EventsNamesAccountEnum from 'apps/account-service/src/enum/events.names.account.enum';
import EventsNamesPersonEnum from 'apps/person-service/src/enum/events.names.person.enum';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { V1DBClient } from '../clients/pomelo.v1.bd.client';

@Injectable()
export class PomeloMigrationService {
  private pomeloIntegration: IntegrationCardService;

  constructor(
    private readonly integration: IntegrationService,
    @Inject(BuildersService)
    private builder: BuildersService,
    private readonly dbClient: V1DBClient,
  ) {
    (async () => {
      this.pomeloIntegration = await this.integration.getCardIntegration(
        IntegrationCardEnum.POMELO,
      );
    })();
  }

  async startPomeloMigration() {
    try {
      const pomeloUsers = await this.pomeloIntegration.getUser({});
      if (pomeloUsers && pomeloUsers.data) {
        pomeloUsers.data.forEach(async (pomeloUser) => {
          const user = await this.migrateUser(pomeloUser);
          if (user && user.slug) {
            // TODO Log Activity
            const person = await this.migratePerson(pomeloUser, user);
            if (person) {
              const pomeloCards = await this.getPomeloCard(pomeloUser.id);
              const hasCards =
                pomeloCards?.meta?.pagination?.total_pages ?? false;
              if (hasCards) {
                pomeloCards.data.forEach(async (card: any) => {
                  const account = await this.migrateCard(card, person);
                  if (account) {
                    const balance = await this.getBalanceByCard(card?.id);
                    if (balance) {
                      await this.setBalanceByCard(card?.id, balance);
                    }
                  } else {
                    // TODO Log error activity
                  }
                });
              }
            }
          }
        });
      }
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }

  private async getBalanceByCard(cardId: string): Promise<any> {
    try {
      Logger.log('Getting Balance', PomeloMigrationService.name);
      const balance = await this.dbClient.getBalanaceByCard(cardId);
      if (!balance) {
        Logger.error(
          `Unable to find balance for card ${cardId}`,
          PomeloMigrationService.name,
        );
        // TODO Log error activity
      }
      return balance;
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }

  private async getPomeloCard(userId: string): Promise<any> {
    try {
      const cardSearchDto: CardSearchDto = { user_id: userId, page_size: 100 };
      return await this.pomeloIntegration.getCardByQuery(cardSearchDto);
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }

  private async setBalanceByCard(cardId: string, amount: number): Promise<any> {
    try {
      Logger.log(
        `Adding balance of ${amount} to card ${cardId}`,
        PomeloMigrationService.name,
      );
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.setBalanceByCard,
        {
          id: cardId,
          amount,
        },
      );
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }

  private async migrateCard(pomeloCard: any, person: any): Promise<any> {
    try {
      Logger.log('Migrating Card', PomeloMigrationService.name);
      let statusText;
      if (pomeloCard?.status === 'ACTIVE') {
        statusText = StatusAccountEnum.UNLOCK;
      } else if (pomeloCard?.status === 'BLOCKED') {
        statusText = StatusAccountEnum.LOCK;
      } else {
        statusText = StatusAccountEnum.CANCEL;
      }
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.mingrateOne,
        {
          name: person?.firstName,
          type: TypesAccountEnum.CARD,
          accountType: CardTypesAccountEnum[pomeloCard.card_type],
          firstName: person?.firstName ?? person?.name,
          lastName: person?.lastName,
          docId: person?.numDocId,
          address: person?.location?.address,
          email: person?.email[0],
          telephone: person?.phoneNumber,
          description: pomeloCard?.affinity_group_name,
          accountId: pomeloCard?.id,
          owner: person?.user?.id,
          statusText,
          cardConfig: {
            id: pomeloCard?.id,
            user_id: pomeloCard?.user_id,
            affinity_group_id: pomeloCard?.affinity_group_id,
            card_type: pomeloCard?.card_type,
            status: pomeloCard?.status,
            start_date: pomeloCard?.start_date,
            last_four: pomeloCard?.last_four,
            provider: pomeloCard?.provider,
            product_type: pomeloCard?.product_type,
            address: {
              street_name: person?.location?.address?.street_name,
              street_number: person?.location?.address?.street_number,
              floor: person?.location?.address?.floor ?? '',
              apartment: person?.location?.address?.apartment ?? '',
              city: person?.location?.address?.city,
              region: person?.location?.address?.region,
              country: CountryCodeEnum.Colombia,
              zip_code: person?.location?.address?.zip_code,
              neighborhood: person?.location?.address?.neighborhood,
            },
          },
        },
      );
      if (!account) {
        // TODO Log error activity
      }
      return account;
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }

  private async migrateUser(pomeloUser: any): Promise<any> {
    try {
      Logger.log('Migrating User', PomeloMigrationService.name);
      const user = await this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.migrateOne,
        {
          name: pomeloUser.name,
          email: pomeloUser.email,
          slugEmail: CommonService.getSlug(pomeloUser.email),
        },
      );
      if (!user) {
        // TODO Log error activity
      }
      return user;
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }

  private async migratePerson(pomeloUser: any, user: any): Promise<any> {
    try {
      Logger.log('Migrating Person', PomeloMigrationService.name);
      const person = await this.builder.getPromisePersonEventClient(
        EventsNamesPersonEnum.migrateOne,
        {
          typeDocId: DocIdTypeEnum[pomeloUser.identification_type],
          numDocId: pomeloUser.identification_value,
          firstName: pomeloUser.name,
          name: pomeloUser.name,
          lastName: pomeloUser.surname,
          gender: GenderEnum[pomeloUser.gender],
          nationality: CountryCodeEnum.Colombia,
          birth: pomeloUser.birthdate,
          emails: [pomeloUser.email],
          email: pomeloUser.email,
          phoneNumber: pomeloUser.phone,
          location: {
            name: pomeloUser.legal_address?.street_name,
            address: {
              street_name: pomeloUser.legal_address?.street_name,
              street_number: pomeloUser.legal_address?.street_number,
              zip_code: pomeloUser.legal_address?.zip_code,
              neighborhood: pomeloUser.legal_address?.neighborhood,
              city: pomeloUser.legal_address?.city,
              region: pomeloUser.legal_address?.region,
              additional_info: pomeloUser.legal_address?.additional_info,
              country: CountryCodeEnum.Colombia,
            },
          },
          country: CountryCodeEnum.Colombia,
          user,
        },
      );
      if (!person) {
        // TODO Log error activity
      }
      return person;
    } catch (error) {
      Logger.error(error, PomeloMigrationService.name);
      // TODO Log error activity
      return null;
    }
  }
}
