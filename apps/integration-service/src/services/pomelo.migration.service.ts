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
import { PomeloV1DBClient } from '../clients/pomelo.v1.bd.client';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';

@Injectable()
export class PomeloMigrationService {
  private pomeloIntegration: IntegrationCardService;

  constructor(
    private readonly integration: IntegrationService,
    @Inject(BuildersService)
    private builder: BuildersService,
    private readonly dbClient: PomeloV1DBClient,
  ) {
    (async () => {
      this.pomeloIntegration = await this.integration.getCardIntegration(
        IntegrationCardEnum.POMELO,
      );
    })();
  }

  async setAllCardsOwner() {
    const log = `${PomeloMigrationService.name}-setAllCardsOwner`;
    let page = 0;
    let pages = 0;
    try {
      do {
        const cards = await this.builder.getPromiseAccountEventClient(
          EventsNamesAccountEnum.findAllCardsToMigrate,
          {
            type: 'CARD',
            page,
            owner: { $exists: false },
          },
        );
        page++;
        pages = cards.lastPage;
        Logger.log(`Cards found: ${cards.list.length}`, log);
        for (let i = 0; i < cards.list.length; i++) {
          const card = cards.list[0];
          if (!card?.owner) {
            const pomeloUser = await this.getUser(card?.cardConfig?.user_id);
            const user = await this.migrateUser(pomeloUser);
            const id = card?.cardConfig?.id;
            const ownedBy = user?._id || user?.id;
            Logger.log(
              `About to update card's owner. Card: ${id}. Owner: ${ownedBy}`,
              log,
            );
            await this.builder.getPromiseAccountEventClient(
              EventsNamesAccountEnum.updateMigratedOwner,
              {
                id,
                owner: ownedBy,
              },
            );
          }
        }
      } while (page <= pages);
    } catch (error) {
      Logger.error(error, log);
    }
  }

  async startPomeloMigrationByUser(userId: string) {
    const pomeloUser = await this.getUser(userId);
    if (pomeloUser && pomeloUser.data) {
      const user = await this.migrateUser(pomeloUser.data);
      Logger.log(user, 'User migrated result');
      if (user && user.slug) {
        // TODO Log Activity
        const person = await this.migratePerson(pomeloUser.data, user);
        if (person) {
          const pomeloCards = await this.getPomeloCard(pomeloUser.data.id);
          Logger.log(
            `Total cards ${pomeloCards.data.length} by user ${person?.email[0]}`,
            `${PomeloMigrationService.name}-startPomeloMigration-cards`,
            `Total cards ${pomeloCards.data.length} by user ${pomeloUser.data.email}`,
            `${PomeloMigrationService.name}-startPomeloMigration-cards`,
          );
          const hasCards = pomeloCards?.meta?.pagination?.total_pages ?? false;
          if (hasCards) {
            for (let j = 0; j < pomeloCards.data.length; j++) {
              const card = pomeloCards.data[j];
              const balance = await this.getBalanceByCard(card?.id);
              const account = await this.migrateCard(
                card,
                person,
                pomeloUser.data.email,
                balance,
              );
            }
          }
        }
      }
    }
  }

  async startPomeloMigration() {
    try {
      let totalPages = 1;
      let currentPage = 0;
      const size = 50;
      let persons = 1;
      do {
        const pomeloUsers = await this.getUsers(size, currentPage);
        Logger.log(
          `Users: ${JSON.stringify(
            pomeloUsers.data.length,
          )} & totalPages ${totalPages} & currentPage ${currentPage}`,
          `${PomeloMigrationService.name}`,
        );
        if (pomeloUsers && pomeloUsers.data) {
          currentPage++;
          totalPages = pomeloUsers?.meta?.pagination?.total_pages ?? 0;
          for (let i = 0; i < pomeloUsers.data.length; i++) {
            const pomeloUser = pomeloUsers.data[i];
            const user = await this.migrateUser(pomeloUser);
            if (user && user.slug) {
              // TODO Log Activity
              const person = await this.migratePerson(
                pomeloUser,
                user,
                persons,
              );
              persons++;
              if (person) {
                const pomeloCards = await this.getPomeloCard(pomeloUser.id);
                Logger.log(
                  `Total cards ${pomeloCards.data.length} by user ${person?.email[0]}`,
                  `${PomeloMigrationService.name}-startPomeloMigration-cards`,
                  `Total cards ${pomeloCards.data.length} by user ${pomeloUser.email}`,
                  `${PomeloMigrationService.name}-startPomeloMigration-cards`,
                );
                const hasCards =
                  pomeloCards?.meta?.pagination?.total_pages ?? false;
                if (hasCards) {
                  for (let j = 0; j < pomeloCards.data.length; j++) {
                    const card = pomeloCards.data[j];
                    const balance = await this.getBalanceByCard(card?.id);
                    const account = await this.migrateCard(
                      card,
                      person,
                      pomeloUser.email,
                      balance,
                    );
                  }
                }
              }
            }
          }
        }
      } while (currentPage <= totalPages);
      return {
        statusCode: 200,
        data: 'Finnished Pomelo Migration',
      };
    } catch (error) {
      Logger.error(
        error,
        `${PomeloMigrationService.name}-startPomeloMigration`,
      );
      // TODO Log error activity
      return null;
    }
  }

  private async getUser(userId?: string) {
    return await this.pomeloIntegration.getUsersByQuery({ userId });
  }

  private async getUsers(page_size?: number, page?: number) {
    return await this.pomeloIntegration.getUsersByQuery({
      page_size: page_size,
      page,
    });
  }

  private createTransferRecord(account: any) {
    this.builder.emitTransferEventClient(
      EventsNamesTransferEnum.createOneMigration,
      {
        integration: 'Pomelo',
        movement: 'Credit',
        status: account?.statusText,
        account: account,
      },
    );
  }

  private async getBalanceByCard(cardId: string): Promise<any> {
    try {
      Logger.log(
        'Getting Balance',
        `${PomeloMigrationService.name}-getBalanceByCard`,
      );
      const balance = await this.dbClient.getBalanaceByCard(cardId);
      if (!balance) {
        Logger.error(
          `Unable to find balance for card ${cardId}`,
          `${PomeloMigrationService.name}-getBalanceByCard`,
        );
        // TODO Log error activity
      } else {
        Logger.debug(
          `The balance card ${cardId} is ${balance}`,
          `${PomeloMigrationService.name}-getBalanceByCard`,
        );
      }
      return balance;
    } catch (error) {
      Logger.error(error, `${PomeloMigrationService.name}-getBalanceByCard`);
      // TODO Log error activity
      return null;
    }
  }

  private async getPomeloCard(userId: string): Promise<any> {
    try {
      const cardSearchDto: CardSearchDto = { user_id: userId, page_size: 1000 };
      return await this.pomeloIntegration.getCardByQuery(cardSearchDto);
    } catch (error) {
      Logger.error(error, `${PomeloMigrationService.name}-getPomeloCard`);
      // TODO Log error activity
      return null;
    }
  }

  private async setBalanceByCard(cardId: string, amount: number): Promise<any> {
    try {
      Logger.log(
        `Adding balance of ${amount} to card ${cardId}`,
        `${PomeloMigrationService.name}-setBalanceByCard`,
      );
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.setBalanceByCard,
        {
          id: cardId,
          amount,
        },
      );
    } catch (error) {
      Logger.error(error, `${PomeloMigrationService.name}-setBalanceByCard`);
      // TODO Log error activity
      return null;
    }
  }

  private async migrateCard(
    pomeloCard: any,
    person: any,
    email: string,
    balance: any,
  ): Promise<any> {
    try {
      Logger.log(
        `Migrating Card ${pomeloCard?.id} for user ${email}`,
        PomeloMigrationService.name,
      );
      if (balance) {
        balance = parseFloat(balance);
      }
      const cardDto = this.buildCardDto(pomeloCard, person, email, balance);
      Logger.debug(
        cardDto,
        `${PomeloMigrationService.name}-migrateCard.cardDto`,
      );
      const account = await this.builder.getPromiseAccountEventClient(
        EventsNamesAccountEnum.mingrateOne,
        cardDto,
      );
      return account;
    } catch (error) {
      Logger.error(error, `${PomeloMigrationService.name}-migrateCard`);
      // TODO Log error activity
      return null;
    }
  }

  private buildCardDto(
    pomeloCard: any,
    person: any,
    email: string,
    balance: any,
  ) {
    let statusText: string;
    if (pomeloCard?.status === 'ACTIVE') {
      statusText = StatusAccountEnum.UNLOCK;
    } else if (pomeloCard?.status === 'BLOCKED') {
      statusText = StatusAccountEnum.LOCK;
    } else {
      statusText = StatusAccountEnum.CANCEL;
    }
    Logger.debug(person, `${PomeloMigrationService.name}-buildCardDto`);
    return {
      name: person?.firstName,
      type: TypesAccountEnum.CARD,
      accountType: CardTypesAccountEnum[pomeloCard.card_type],
      firstName: person?.firstName ?? person?.name,
      lastName: person?.lastName,
      docId: person?.numDocId,
      address: person?.location?.address,
      email: email,
      telephone: person?.phoneNumber,
      description: pomeloCard?.affinity_group_name,
      afgId: pomeloCard?.affinity_group_id,
      accountId: pomeloCard?.id,
      owner: person?.user,
      statusText,
      amount: balance ?? 0,
      currency: CurrencyCodeB2cryptoEnum.USD,
      amountCustodial: balance ?? 0,
      currencyCustodial: CurrencyCodeB2cryptoEnum.USD,
      amountBlocked: 0,
      currencyBlocked: CurrencyCodeB2cryptoEnum.USD,
      amountBlockedCustodial: 0,
      currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USD,
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
    };
  }

  private async migrateUser(pomeloUser: any): Promise<any> {
    try {
      Logger.log(
        `Migrating User ${pomeloUser?.email}`,
        `${PomeloMigrationService.name}-migrateUser`,
      );
      const user = {
        name: pomeloUser?.data?.name,
        email: pomeloUser?.data?.email,
        password: '123Abc',
        slugEmail: CommonService.getSlug(pomeloUser?.data?.email),
      };
      return this.builder.getPromiseUserEventClient(
        EventsNamesUserEnum.migrateOne,
        user,
      );
    } catch (error) {
      Logger.error(error, `${PomeloMigrationService.name}-migrateUser`);
      // TODO Log error activity
      return null;
    }
  }

  private async migratePerson(
    pomeloUser: any,
    user: any,
    persons?: number,
  ): Promise<any> {
    try {
      Logger.log(
        `Migrating Person ${pomeloUser?.email} total so far: ${
          persons ?? 'One'
        }`,
        `${PomeloMigrationService.name}-migratePerson`,
      );
      const person = await this.builder.getPromisePersonEventClient(
        EventsNamesPersonEnum.migrateOne,
        {
          typeDocId: DocIdTypeEnum[pomeloUser.identification_type],
          numDocId: pomeloUser.identification_value,
          firstName: pomeloUser.name,
          name: `${pomeloUser.name} ${pomeloUser.surname}`,
          lastName: `${pomeloUser.name} ${pomeloUser.surname}`,
          gender: GenderEnum[pomeloUser.gender],
          nationality: CountryCodeEnum.Colombia,
          birth: pomeloUser.birthdate,
          emails: [pomeloUser?.email],
          email: pomeloUser?.email,
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
          user: user?._id,
        },
      );
      return person;
    } catch (error) {
      Logger.error(error, `${PomeloMigrationService.name}-migratePerson`);
      // TODO Log error activity
      return null;
    }
  }
}
