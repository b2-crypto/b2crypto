import { AccountServiceController } from './account-service.controller';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import { AccountServiceService } from './account-service.service';
import { Test, TestingModule } from '@nestjs/testing';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';

describe('AccountServiceController', () => {
  let account;
  let accountServiceController: AccountServiceController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AccountServiceController],
      providers: [AccountServiceService],
    }).compile();

    accountServiceController = app.get<AccountServiceController>(
      AccountServiceController,
    );
  });

  describe('root', () => {
    it('should be create', () => {
      const accountDto: AccountCreateDto = {
        affiliate: undefined,
        crm: undefined,
        referral: '',
        name: 'mexico',
        description: '123456',
        docId: '',
        email: '',
        telephone: '',
        accountId: '',
        referralType: '',
        brand: undefined,
        searchText: '',
        showToAffiliate: false,
        hasSendDisclaimer: false,
        country: CountryCodeEnum.na,
        personalData: undefined,
        id: undefined,
        slug: '',
        totalTransfer: 0,
        quantityTransfer: 0,
        accountStatus: [],
        createdAt: undefined,
        updatedAt: undefined,
      };
      expect(
        accountServiceController
          .createOne(accountDto)
          .then((createdAccount) => {
            account = createdAccount;
          }),
      ).toHaveProperty('name', account.name);
    });

    it('should be update', () => {
      const accountDto: AccountUpdateDto = {
        id: account.id,
        name: 'colombia',
        description: '987654321',
      };
      expect(
        accountServiceController
          .updateOne(accountDto)
          .then((updatedAccount) => {
            account = updatedAccount;
          }),
      ).toHaveProperty('name', accountDto.name);
    });

    it('should be delete', () => {
      expect(accountServiceController.deleteOneById(account.id)).toReturn();
    });
  });
});
