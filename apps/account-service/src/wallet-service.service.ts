import { WalletDepositCreateDto } from '@account/account/dto/wallet-deposit.create.dto';
import { WalletCreateDto } from '@account/account/dto/wallet.create.dto';
import { AccountEntity } from '@account/account/entities/account.entity';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import StatusAccountEnum from '@account/account/enum/status.account.enum';
import TypesAccountEnum from '@account/account/enum/types.account.enum';
import WalletTypesAccountEnum from '@account/account/enum/wallet.types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { CommonService } from '@common/common';
import CountryCodeEnum from '@common/common/enums/country.code.b2crypto.enum';
import CurrencyCodeB2cryptoEnum from '@common/common/enums/currency-code-b2crypto.enum';
import { EnvironmentEnum } from '@common/common/enums/environment.enum';
import { StatusCashierEnum } from '@common/common/enums/StatusCashierEnum';
import TagEnum from '@common/common/enums/TagEnum';
import { IntegrationService } from '@integration/integration';
import IntegrationCryptoEnum from '@integration/integration/crypto/enums/IntegrationCryptoEnum';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';
import { User } from '@user/user/entities/mongoose/user.schema';
import EventsNamesCategoryEnum from 'apps/category-service/src/enum/events.names.category.enum';
import EventsNamesCrmEnum from 'apps/crm-service/src/enum/events.names.crm.enum';
import EventsNamesMessageEnum from 'apps/message-service/src/enum/events.names.message.enum';
import EventsNamesPspAccountEnum from 'apps/psp-service/src/enum/events.names.psp.acount.enum';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';
import { TransferCreateButtonDto } from 'apps/transfer-service/src/dto/transfer.create.button.dto';
import EventsNamesTransferEnum from 'apps/transfer-service/src/enum/events.names.transfer.enum';
import { UserServiceService } from 'apps/user-service/src/user-service.service';
import { isMongoId } from 'class-validator';
import { InjectPinoLogger, PinoLogger } from 'nestjs-pino';
import { AccountServiceService } from './account-service.service';
import { WalletWithdrawalDto } from './dtos/WalletWithdrawalDto';
import EventsNamesAccountEnum from './enum/events.names.account.enum';

@Traceable()
@Injectable()
export class WalletServiceService {
  private cryptoType: any = null;
  constructor(
    @InjectPinoLogger(WalletServiceService.name)
    protected readonly logger: PinoLogger,
    @Inject(UserServiceService)
    private readonly userService: UserServiceService,
    @Inject(AccountServiceService)
    private readonly accountService: AccountServiceService,
    @Inject(BuildersService)
    private readonly ewalletBuilder: BuildersService,
    private readonly integration: IntegrationService,
    private readonly configService: ConfigService,
  ) {}

  async rechargeWallet(
    createDto: WalletDepositCreateDto,
    userId: string,
    host: string,
  ) {
    const isProd =
      this.configService.get<string>('ENVIRONMENT') === EnvironmentEnum.prod;

    const user = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    if (createDto.amount <= 10) {
      throw new BadRequestException('The operation not be less to 11');
    }

    if (!createDto.to && !createDto.from) {
      throw new BadRequestException('Need from and/or to wallet');
    }

    let to = null;
    if (isMongoId(createDto.to.toString())) {
      to = await this.accountService.findOneById(createDto.to.toString());
    } else {
      throw new BadRequestException('Wallet are unsupported');
    }

    if (!createDto.from && to?.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet to not found');
    }

    if (createDto.from) {
      const from = await this.accountService.findOneById(
        createDto.from.toString(),
      );
      if (from?.type != TypesAccountEnum.WALLET) {
        throw new BadRequestException('Wallet from not found');
      }

      const costTx = 5;
      const comisionTx = 0.03;
      const valueToPay = createDto.amount * comisionTx + costTx;

      if (from.amount < createDto.amount + valueToPay) {
        throw new BadRequestException('Not enough balance');
      }

      const [
        depositWalletCategory,
        withdrawalWalletCategory,
        paymentWalletCategory,
        purchaseWalletCategory,
        approvedStatus,
        pendingStatus,
        internalPspAccount,
      ] = await Promise.all([
        this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          { slug: 'deposit-wallet', type: TagEnum.MONETARY_TRANSACTION_TYPE },
        ),
        this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'withdrawal-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        ),
        this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          { slug: 'payment-wallet', type: TagEnum.MONETARY_TRANSACTION_TYPE },
        ),
        this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          { slug: 'purchase-wallet', type: TagEnum.MONETARY_TRANSACTION_TYPE },
        ),
        this.ewalletBuilder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'approved',
        ),
        this.ewalletBuilder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'pending',
        ),
        this.ewalletBuilder.getPromisePspAccountEventClient(
          EventsNamesPspAccountEnum.findOneByName,
          'internal',
        ),
      ]);

      if (
        !depositWalletCategory ||
        !withdrawalWalletCategory ||
        !paymentWalletCategory ||
        !purchaseWalletCategory
      ) {
        if (!depositWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "deposit wallet" not found',
          );
        }
        if (!withdrawalWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "withdrawal wallet" not found',
          );
        }
        if (!paymentWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "payment wallet" not found',
          );
        }
        if (!purchaseWalletCategory) {
          throw new BadRequestException(
            'Monetary transaction type "purchase wallet" not found',
          );
        }
      }

      if (isProd) {
        let fireblocksCrm = null;
        let walletBase = null;
        let vaultFrom = null;
        let cryptoType = null;

        try {
          fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
            EventsNamesCrmEnum.findOneByName,
            IntegrationCryptoEnum.FIREBLOCKS,
          );
          walletBase = await this.getWalletBase(fireblocksCrm._id, from.name);
          vaultFrom = await this.getVaultUser(
            from.owner.toString(),
            fireblocksCrm._id,
            walletBase,
            from.brand.toString(),
          );
          cryptoType = await this.getFireblocksType();

          const vaultBrandDeposit = await this.getVaultBrand(
            fireblocksCrm._id,
            walletBase,
            from.brand.toString(),
            WalletTypesAccountEnum.VAULT_D,
          );

          const dtoWallet = new WalletCreateDto();
          dtoWallet.name = walletBase.name;
          dtoWallet.type = TypesAccountEnum.WALLET;
          dtoWallet.accountType = WalletTypesAccountEnum.VAULT_W;
          dtoWallet.accountName = walletBase.accountName;
          dtoWallet.nativeAccountName = walletBase.nativeAccountName;
          dtoWallet.accountId = walletBase.accountId;
          dtoWallet.crm = fireblocksCrm;
          dtoWallet.owner = user.id ?? user._id;

          const walletBrandDeposit = await this.getWalletBrand(
            dtoWallet,
            fireblocksCrm._id,
            vaultBrandDeposit,
            String(from.brand),
            WalletTypesAccountEnum.VAULT_W,
          );

          let rta = null;
          if (from.amountCustodial > createDto.amount) {
            const promisesTx = [];
            if (to?._id) {
              const vaultTo = await this.getVaultUser(
                to.owner.toString(),
                fireblocksCrm._id,
                walletBase,
                to.brand.toString(),
              );
              rta = await cryptoType.createTransaction(
                from.accountId,
                String(createDto.amount),
                vaultFrom.accountId,
                vaultTo.accountId,
              );

              promisesTx.push(
                this.accountService.customUpdateOne({
                  id: to._id,
                  $inc: {
                    amountCustodial: createDto.amount,
                  },
                }),
              );
            } else {
              rta = await cryptoType.createTransaction(
                from.accountId,
                String(createDto.amount),
                vaultFrom.accountId,
                createDto.to.toString(),
                'Withdrawal',
                true,
              );
            }

            promisesTx.push(
              this.accountService.customUpdateOne({
                id: from._id,
                $inc: {
                  amountCustodial: createDto.amount * -1,
                },
              }),
            );

            promisesTx.push(
              this.payByServicesFromWallet(
                from,
                walletBrandDeposit,
                valueToPay,
                userId,
                rta.data,
              ),
            );

            await Promise.all(promisesTx);
          } else {
            const vaultBrandWithdraw = await this.getVaultBrand(
              fireblocksCrm._id,
              walletBase,
              to.brand.toString(),
              WalletTypesAccountEnum.VAULT_W,
            );

            const walletBrandWithdraw = await this.getWalletBrand(
              dtoWallet,
              fireblocksCrm._id,
              vaultBrandWithdraw,
              String(to.brand),
              WalletTypesAccountEnum.VAULT_W,
            );

            if (
              walletBrandWithdraw.amountCustodial + from.amountCustodial <
              createDto.amount
            ) {
              throw new BadRequestException('Insufficient funds');
            }

            rta = await cryptoType.createTransaction(
              from.accountId,
              String(from.amountCustodial),
              vaultFrom.accountId,
              vaultBrandWithdraw.accountId,
            );

            const promisesTx = [];
            promisesTx.push(
              this.accountService.customUpdateOne({
                id: from._id,
                $inc: {
                  amountCustodial: from.amountCustodial * -1,
                },
              }),
              this.accountService.customUpdateOne({
                id: walletBrandWithdraw._id,
                $inc: {
                  amountCustodial: from.amountCustodial,
                },
              }),
            );

            if (to?._id) {
              const vaultTo = await this.getVaultUser(
                String(to.owner),
                fireblocksCrm._id,
                walletBase,
                String(to.brand),
              );

              rta = await cryptoType.createTransaction(
                from.accountId,
                String(createDto.amount),
                vaultBrandWithdraw.accountId,
                vaultTo.accountId,
              );

              promisesTx.push(
                this.accountService.customUpdateOne({
                  id: walletBrandWithdraw._id,
                  $inc: {
                    amountCustodial: createDto.amount * -1,
                  },
                }),
              );
            } else {
              rta = await cryptoType.createTransaction(
                from.accountId,
                String(createDto.amount),
                vaultBrandWithdraw.accountId,
                createDto.to.toString(),
                'Withdrawal',
                true,
              );

              promisesTx.push(
                this.accountService.customUpdateOne({
                  id: walletBrandWithdraw._id,
                  $inc: {
                    amountCustodial: createDto.amount * -1,
                  },
                }),
              );
            }

            promisesTx.push(
              this.payByServicesFromWallet(
                from,
                walletBrandDeposit,
                valueToPay,
                userId,
                rta.data,
              ),
            );

            await Promise.all(promisesTx);
          }

          if (to?._id) {
            await this.ewalletBuilder.emitTransferEventClient(
              EventsNamesTransferEnum.createOne,
              {
                name: `Deposit wallet ${to.name}`,
                description: `Deposit from ${from.name} to ${to.name}`,
                currency: to.currency,
                idPayment: rta?.data?.id,
                responsepayment: rta?.data,
                amount: createDto.amount,
                currencyCustodial: to.currencyCustodial,
                amountCustodial: createDto.amount,
                account: to._id,
                userCreator: userId,
                userAccount: to.owner,
                typeTransaction: depositWalletCategory._id,
                psp: internalPspAccount.psp,
                pspAccount: internalPspAccount._id,
                operationType: OperationTransactionType.deposit,
                page: host,
                statusPayment: StatusCashierEnum.APPROVED,
                isApprove: true,
                status: approvedStatus._id,
                brand: to.brand,
                crm: to.crm,
                confirmedAt: new Date(),
                approvedAt: new Date(),
              } as unknown as TransferCreateDto,
            );
          }

          await this.ewalletBuilder.emitTransferEventClient(
            EventsNamesTransferEnum.createOne,
            {
              name: `Withdrawal wallet ${from.name}`,
              description: `Withdrawal from ${from.name} to ${
                to?.name ?? createDto.to
              }`,
              currency: from.currency,
              idPayment: rta?.data?.id,
              responsepayment: rta?.data,
              amount: createDto.amount,
              currencyCustodial: from.currencyCustodial,
              amountCustodial: createDto.amount,
              account: from._id,
              userCreator: userId,
              userAccount: from.owner,
              typeTransaction: withdrawalWalletCategory._id,
              psp: internalPspAccount.psp,
              pspAccount: internalPspAccount._id,
              operationType: OperationTransactionType.withdrawal,
              page: host,
              statusPayment: StatusCashierEnum.PENDING,
              status: pendingStatus._id,
              brand: from.brand,
              crm: from.crm,
            } as unknown as TransferCreateDto,
          );

          from.amount = from.amount - createDto.amount;
          return from;
        } catch (error) {
          this.logger.error(
            'Error creating transaction on Fireblocks',
            error.message,
          );
          throw new BadRequestException('Sorry, something went wrong');
        }
      } else {
        return this.handleInternalTransfer(createDto, to, from, user, host);
      }
    } else {
      if (isProd && to.crm) {
        return this.handleFireblocksDeposit(to);
      } else {
        return this.handleExternalDeposit(createDto, to, user, host);
      }
    }
  }

  private async payByServicesFromWallet(
    walletFrom: AccountEntity,
    walletTo: AccountEntity,
    amount: number,
    creatorId: string,
    paymentResponse: any,
  ): Promise<AccountDocument> {
    const [
      paymentWalletCategory,
      purchaseWalletCategory,
      approvedStatus,
      pendingStatus,
      internalPspAccount,
    ] = await Promise.all([
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        { slug: 'payment-wallet', type: TagEnum.MONETARY_TRANSACTION_TYPE },
      ),
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        { slug: 'purchase-wallet', type: TagEnum.MONETARY_TRANSACTION_TYPE },
      ),
      this.ewalletBuilder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      ),
      this.ewalletBuilder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'pending',
      ),
      this.ewalletBuilder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      ),
    ]);

    await this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Payment transfer ${walletTo.name}`,
        description: `Payment from ${walletFrom.name} to ${walletTo.name}`,
        currency: walletTo.currency,
        idPayment: paymentResponse?.id,
        responsepayment: paymentResponse,
        amount: amount,
        currencyCustodial: walletTo.currencyCustodial,
        amountCustodial: amount,
        account: walletTo._id,
        userCreator: creatorId,
        userAccount: walletTo.owner,
        typeTransaction: paymentWalletCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.payment,
        page: 'Fee Transfer to wallet',
        statusPayment: StatusCashierEnum.APPROVED,
        isApprove: true,
        status: approvedStatus._id,
        brand: walletTo.brand,
        crm: walletTo.crm,
        confirmedAt: new Date(),
        approvedAt: new Date(),
      } as unknown as TransferCreateDto,
    );

    await this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Purchase transfer ${walletFrom.name}`,
        description: `Purchase from ${walletFrom.name} to ${walletTo?.name}`,
        currency: walletFrom.currency,
        idPayment: paymentResponse?.id,
        responsepayment: paymentResponse,
        amount: amount,
        currencyCustodial: walletFrom.currencyCustodial,
        amountCustodial: amount,
        account: walletFrom._id,
        userCreator: creatorId,
        userAccount: walletFrom.owner,
        typeTransaction: purchaseWalletCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.purchase,
        page: 'Fee Transfer to wallet',
        statusPayment: StatusCashierEnum.PENDING,
        status: pendingStatus._id,
        brand: walletFrom.brand,
        crm: walletFrom.crm,
      } as unknown as TransferCreateDto,
    );

    return walletFrom as unknown as AccountDocument;
  }

  private async getWalletBrand(
    dtoWallet: WalletCreateDto,
    fireblocksCrmId: string,
    vaultBrand: AccountDocument,
    brandId: string,
    accountType = WalletTypesAccountEnum.VAULT,
  ) {
    const walletName = `${dtoWallet.name}-${brandId}-${accountType}`;
    let walletUser = (
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

      dtoWallet.responseCreation = newWallet;
      dtoWallet.showToOwner = true;
      dtoWallet.brand = brandId;
      dtoWallet.accountName = newWallet.address;
      dtoWallet.pin =
        dtoWallet.pin ??
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
      dtoWallet.accountType = WalletTypesAccountEnum.VAULT;

      walletUser = await this.accountService.createOne(dtoWallet);
    }

    return walletUser;
  }

  private async getVaultBrand(
    fireblocksCrmId: string,
    walletBase: AccountDocument,
    brandId: string,
    accountType = WalletTypesAccountEnum.VAULT,
  ) {
    const vaultName = `${brandId}-vault-${accountType}`;
    let vaultBrand = (
      await this.accountService.findAll({
        where: {
          name: vaultName,
          brand: brandId,
          type: TypesAccountEnum.WALLET,
          accountType,
          crm: fireblocksCrmId,
          showToOwner: false,
          owner: {
            $exists: false,
          },
        },
      })
    ).list[0];

    if (!vaultBrand) {
      const cryptoType = await this.getFireblocksType();
      const newVault = await cryptoType.createVault(vaultName);
      vaultBrand = await this.accountService.createOne({
        name: vaultName,
        slug: `${brandId}-vault`,
        owner: undefined,
        accountType,
        crm: fireblocksCrmId,
        accountId: newVault.id,
        accountName: walletBase.accountName,
        showToOwner: false,
        pin: CommonService.getNumberDigits(
          CommonService.randomIntNumber(9999),
          4,
        ),
        responseCreation: newVault,
        type: TypesAccountEnum.WALLET,
        searchText: '',
        docId: '',
        secret: '',
        address: null,
        email: '',
        telephone: '',
        description: '',
        decimals: walletBase.decimals,
        hasSendDisclaimer: false,
        referral: walletBase.referral,
        protocol: walletBase.protocol,
        country: CountryCodeEnum.Colombia,
        personalData: undefined,
        brand: brandId,
        affiliate: undefined,
        totalTransfer: 0,
        quantityTransfer: 0,
        statusText: StatusAccountEnum.HIDDEN,
        accountStatus: [],
        createdAt: undefined,
        updatedAt: undefined,
        cardConfig: undefined,
        amount: 0,
        currency: CurrencyCodeB2cryptoEnum.USDT,
        amountCustodial: 0,
        currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
        amountBlocked: 0,
        currencyBlocked: CurrencyCodeB2cryptoEnum.USDT,
        amountBlockedCustodial: 0,
        currencyBlockedCustodial: CurrencyCodeB2cryptoEnum.USDT,
        id: undefined,
        afgId: '', // TODO: AFG ID Hender
      });
    }

    return vaultBrand;
  }

  private async handleFireblocksTransfer(
    createDto: WalletDepositCreateDto,
    from: any,
    to: any,
    user: User,
    host: string,
  ) {
    const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );

    const [
      depositWalletCategory,
      withdrawalWalletCategory,
      approvedStatus,
      internalPspAccount,
    ] = await Promise.all([
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'deposit-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      ),
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'withdrawal-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      ),
      this.ewalletBuilder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      ),
      this.ewalletBuilder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      ),
    ]);

    const walletBase = await this.getWalletBase(fireblocksCrm._id, from.name);
    const vaultFrom = await this.getVaultUser(
      from.owner.toString(),
      fireblocksCrm._id,
      walletBase,
      from.brand.toString(),
    );

    const costTx = 5;
    const comisionTx = 0.03;
    const valueToPay = createDto.amount * comisionTx + costTx;

    if (from.amount < createDto.amount + valueToPay) {
      throw new BadRequestException('Not enough balance');
    }

    try {
      const cryptoType = await this.getFireblocksType();
      const vaultTo = await this.getVaultUser(
        to.owner.toString(),
        fireblocksCrm._id,
        walletBase,
        to.brand.toString(),
      );

      const rta = await cryptoType.createTransaction(
        from.accountId,
        String(createDto.amount),
        vaultFrom.accountId,
        vaultTo.accountId,
      );

      await this.updateWalletBalances(from._id, to._id, createDto.amount);

      await this.createTransferEvents(
        to,
        from,
        createDto,
        user,
        depositWalletCategory,
        withdrawalWalletCategory,
        approvedStatus,
        internalPspAccount,
        host,
      );

      return {
        statusCode: 200,
        data: rta.data,
      };
    } catch (error) {
      throw new BadRequestException('Error processing Fireblocks transaction');
    }
  }

  private handleFireblocksDeposit(to: any) {
    const base =
      to.accountId.indexOf('ARB') >= 0
        ? 'https://arbscan.org/address/'
        : 'https://tronscan.org/#/address/';

    return {
      statusCode: 200,
      data: {
        url: `${base}${to.accountName}`,
        address: to.accountName,
        chain: to.nativeAccountName,
      },
    };
  }

  async createWallet(
    createDto: WalletCreateDto,
    userId?: string,
  ): Promise<any> {
    const _userId = userId ?? createDto.owner;
    if (!_userId) {
      throw new BadRequestException('Need the user id to continue');
    }

    const user = await this.getUser(_userId);

    switch (createDto.accountType) {
      case WalletTypesAccountEnum.EWALLET:
        return this.createWalletB2BinPay(createDto, user);
      case WalletTypesAccountEnum.VAULT:
        return this.createWalletFireblocks(createDto, user);
      default:
        throw new BadRequestException(
          `The accountType ${createDto.accountType} is not valid`,
        );
    }
  }

  private async validateAndGetUser(userId: string) {
    const user = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }
    return user;
  }

  private validateRechargeAmount(amount: number) {
    if (amount <= 10) {
      throw new BadRequestException('The recharge not be 10 or less');
    }
  }

  private async validateAndGetToWallet(walletId: string) {
    const wallet = await this.accountService.findOneById(walletId);
    if (wallet.type !== TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }
    return wallet;
  }

  private async validateAndGetFromWallet(walletId: string) {
    const wallet = await this.accountService.findOneById(walletId);
    if (wallet?.type !== TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }
    return wallet;
  }

  private async updateWalletBalances(
    fromId: string,
    toId: string,
    amount: number,
  ) {
    await Promise.all([
      this.accountService.customUpdateOne({
        id: toId,
        $inc: { amount: amount },
      }),
      this.accountService.customUpdateOne({
        id: fromId,
        $inc: { amount: amount * -1 },
      }),
    ]);
  }
  private async handleInternalTransfer(
    createDto: WalletDepositCreateDto,
    to: any,
    from: any,
    user: User,
    host: string,
  ) {
    if (from.type != TypesAccountEnum.WALLET) {
      throw new BadRequestException('Wallet not found');
    }

    const [
      depositWalletCategory,
      withDrawalWalletCategory,
      approvedStatus,
      internalPspAccount,
    ] = await Promise.all([
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'deposit-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      ),
      this.ewalletBuilder.getPromiseCategoryEventClient(
        EventsNamesCategoryEnum.findOneByNameType,
        {
          slug: 'withdrawal-wallet',
          type: TagEnum.MONETARY_TRANSACTION_TYPE,
        },
      ),
      this.ewalletBuilder.getPromiseStatusEventClient(
        EventsNamesStatusEnum.findOneByName,
        'approved',
      ),
      this.ewalletBuilder.getPromisePspAccountEventClient(
        EventsNamesPspAccountEnum.findOneByName,
        'internal',
      ),
    ]);

    const result = await Promise.all([
      this.accountService.customUpdateOne({
        id: createDto.to,
        $inc: { amount: createDto.amount },
      }),
      this.accountService.customUpdateOne({
        id: createDto.from.toString(),
        $inc: { amount: createDto.amount * -1 },
      }),
    ]).then((list) => list[0]);

    this.createTransferEvents(
      to,
      from,
      createDto,
      user,
      depositWalletCategory,
      withDrawalWalletCategory,
      approvedStatus,
      internalPspAccount,
      host,
    );

    return result;
  }

  private async handleExternalDeposit(
    createDto: WalletDepositCreateDto,
    to: AccountEntity,
    user: User,
    host: string,
  ) {
    if (to.crm) {
      const address = to.accountName;
      let base = 'https://tronscan.org/#/address/';
      if (to.accountId.indexOf('ARB') >= 0) {
        base = 'https://arbscan.org/address/';
      }
      return {
        statusCode: 200,
        data: {
          url: `${base}${address}`,
          address,
          chain: to.nativeAccountName,
        },
      };
    }

    const transferBtn: TransferCreateButtonDto = {
      amount: createDto.amount.toString(),
      currency: 'USDT',
      account: to._id.toString(),
      creator: user.id.toString(),
      details: 'Recharge in wallet',
      customer_name: user.name,
      customer_email: user.email,
      public_key: null,
      identifier: user._id.toString(),
    };

    try {
      let depositAddress = to.responseCreation;
      if (!depositAddress) {
        depositAddress =
          await this.ewalletBuilder.getPromiseTransferEventClient(
            EventsNamesTransferEnum.createOneDepositLink,
            transferBtn,
          );
        this.ewalletBuilder.emitAccountEventClient(
          EventsNamesAccountEnum.updateOne,
          {
            id: to._id,
            responseCreation: depositAddress,
          },
        );
      }
      const data = depositAddress?.responseAccount?.data;
      return {
        statusCode: 200,
        data: {
          txId: depositAddress?._id,
          url: `https://tronscan.org/#/address/${data?.attributes?.address}`,
          address: data?.attributes?.address ?? to.accountName,
          chain: 'TRON BLOCKCHAIN',
        },
      };
    } catch (error) {
      throw new BadRequestException(error);
    }
  }

  private createTransferEvents(
    to: any,
    from: any,
    createDto: WalletDepositCreateDto,
    user: User,
    depositWalletCategory: any,
    withDrawalWalletCategory: any,
    approvedStatus: any,
    internalPspAccount: any,
    host: string,
  ) {
    const commonTransferData = {
      currency: to.currency,
      amount: createDto.amount,
      currencyCustodial: to.currencyCustodial,
      amountCustodial: createDto.amount,
      userCreator: user.id,
      psp: internalPspAccount.psp,
      pspAccount: internalPspAccount._id,
      page: host,
      statusPayment: StatusCashierEnum.APPROVED,
      approve: true,
      status: approvedStatus._id,
      confirmedAt: new Date(),
      approvedAt: new Date(),
    };

    this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        ...commonTransferData,
        name: `Recharge wallet ${to.name}`,
        description: `Recharge from wallet ${from.name} to card ${to.name}`,
        account: to._id,
        userAccount: to.owner,
        typeTransaction: depositWalletCategory._id,
        operationType: OperationTransactionType.deposit,
        brand: to.brand,
        crm: to.crm,
      } as unknown as TransferCreateDto,
    );

    this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        ...commonTransferData,
        name: `Withdrawal wallet ${from.name}`,
        description: `Recharge from wallet ${from.name} to card ${to.name}`,
        account: from._id,
        userAccount: from.owner,
        typeTransaction: withDrawalWalletCategory._id,
        operationType: OperationTransactionType.withdrawal,
        brand: from.brand,
        crm: from.crm,
      } as unknown as TransferCreateDto,
    );
  }

  private async getFireblocksType() {
    if (!this.cryptoType) {
      this.cryptoType = await this.integration.getCryptoIntegration(
        null,
        IntegrationCryptoEnum.FIREBLOCKS,
        '',
      );
    }
    return this.cryptoType;
  }

  private async getWalletBase(fireblocksCrmId: string, nameWallet: string) {
    const walletBase = (
      await this.accountService.availableWalletsFireblocks({
        where: {
          crm: fireblocksCrmId,
          name: nameWallet,
          showToOwner: false,
          owner: {
            $exists: false,
          },
        },
      })
    ).list[0];

    if (!walletBase) {
      throw new BadRequestException(
        `The wallet ${nameWallet} is not available`,
      );
    }

    return walletBase;
  }

  private async getVaultUser(
    userId: string,
    fireblocksCrmId: string,
    walletBase: any,
    brandId: string,
  ) {
    const vaultUserList = await this.accountService.findAll({
      where: {
        name: `${userId}-vault`,
        accountType: WalletTypesAccountEnum.VAULT,
        crm: fireblocksCrmId,
        showToOwner: false,
        owner: userId,
      },
    });

    let vaultUser = vaultUserList.list[0];
    if (!vaultUser) {
      const cryptoType = await this.getFireblocksType();
      const newVault = await cryptoType.createVault(`${userId}-vault`);
      vaultUser = await this.accountService.createOne({
        name: `${userId}-vault`,
        slug: `${userId}-vault`,
        owner: userId,
        accountType: WalletTypesAccountEnum.VAULT,
        crm: fireblocksCrmId,
        accountId: newVault.id,
        accountName: walletBase.accountName,
        showToOwner: false,
        pin: CommonService.getNumberDigits(
          CommonService.randomIntNumber(9999),
          4,
        ),
        responseCreation: newVault,
        type: TypesAccountEnum.WALLET,
        brand: brandId,
        protocol: walletBase.protocol,
        currency: CurrencyCodeB2cryptoEnum.USDT,
        currencyCustodial: CurrencyCodeB2cryptoEnum.USDT,
        decimals: walletBase.decimals,
        referral: walletBase.referral,
        statusText: StatusAccountEnum.VISIBLE,
        id: undefined,
        searchText: '',
        docId: '',
        secret: '',
        address: {
          street_name: '',
          street_number: '',
          floor: '',
          zip_code: '',
          apartment: '',
          neighborhood: '',
          city: '',
          region: '',
          additional_info: '',
          country: '',
        },
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
        afgId: '',
      });
    }

    return vaultUser;
  }

  private async createWalletFireblocks(createDto: WalletCreateDto, user: any) {
    if (EnvironmentEnum.prod !== this.configService.get('ENVIRONMENT')) {
      throw new BadRequestException('Only work in Prod');
    }

    const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );

    const walletBase = await this.getWalletBase(
      fireblocksCrm._id,
      createDto.name,
    );
    const vaultUser = await this.getVaultUser(
      user.id,
      fireblocksCrm._id,
      walletBase,
      createDto.brand,
    );

    createDto.type = TypesAccountEnum.WALLET;
    createDto.accountName = walletBase.accountName;
    createDto.nativeAccountName = walletBase.nativeAccountName;
    createDto.accountId = walletBase.accountId;
    createDto.crm = fireblocksCrm;
    createDto.owner = user.id ?? user._id;

    const createdWallet = await this.getWalletUser(
      createDto,
      user.id,
      fireblocksCrm._id,
      vaultUser,
    );
    await this.sendNotification(createdWallet, user);

    return createdWallet;
  }

  private async getUser(userId: string) {
    const user = (
      await this.userService.getAll({
        relations: ['personalData'],
        where: { _id: userId },
      })
    ).list[0];

    if (!user.personalData) {
      throw new BadRequestException('Need the personal data to continue');
    }

    return user;
  }

  private async sendNotification(wallet: any, user: any) {
    const emailData = {
      destinyText: user.email,
      vars: {
        name: user.name,
        accountType: wallet.accountType,
        accountName: wallet.accountName,
        balance: wallet.amount,
        currency: wallet.currency,
        accountId: wallet.accountId,
      },
    };

    await this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData,
    );
  }

  private async createWalletB2BinPay(createDto: WalletCreateDto, user: any) {
    createDto.type = TypesAccountEnum.WALLET;
    createDto.accountId = '2177';
    createDto.accountName = 'CoxSQtiWAHVo';
    createDto.accountPassword = 'w7XDOfgfudBvRG';
    createDto.owner = user.id ?? user._id;
    createDto.pin =
      createDto.pin ??
      CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
    createDto.currency = CurrencyCodeB2cryptoEnum.USDT;
    createDto.currencyCustodial = CurrencyCodeB2cryptoEnum.USDT;

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
      currency: CurrencyCodeB2cryptoEnum.USDT,
      account: createdWallet.id ?? createdWallet._id,
      creator: createDto.owner,
      details: 'Deposit address',
      customer_name: user.name,
      customer_email: user.email,
      public_key: null,
      identifier: createDto.owner,
    };

    await this.ewalletBuilder.emitMessageEventClient(
      EventsNamesMessageEnum.sendCryptoWalletsManagement,
      emailData,
    );

    if (this.configService.get('ENVIRONMENT') === EnvironmentEnum.prod) {
      const depositLink =
        await this.ewalletBuilder.getPromiseTransferEventClient(
          EventsNamesTransferEnum.createOneDepositLink,
          transferBtn,
        );

      await this.ewalletBuilder.emitAccountEventClient(
        EventsNamesAccountEnum.updateOne,
        {
          id: createdWallet.id ?? createdWallet._id,
          responseCreation: depositLink,
        },
      );
    }

    return createdWallet;
  }

  private async getWalletUser(
    createDto: WalletCreateDto,
    userId: string,
    fireblocksCrmId: string,
    vaultUser: any,
  ) {
    const walletName = `${createDto.name}-${userId}`;
    let walletUser = (
      await this.accountService.findAll({
        where: {
          name: walletName,
          owner: userId,
          accountType: WalletTypesAccountEnum.VAULT,
          crm: fireblocksCrmId,
          showToOwner: true,
          brand: createDto.brand,
          referral: vaultUser.id,
        },
      })
    ).list[0];

    if (!walletUser) {
      const cryptoType = await this.getFireblocksType();
      const newWallet = await cryptoType.createWallet(
        vaultUser.accountId,
        createDto.accountId,
      );

      if (!newWallet) {
        throw new BadRequestException('Error creating new wallet');
      }

      createDto.responseCreation = newWallet;
      createDto.showToOwner = true;
      createDto.accountName = newWallet.address;
      createDto.pin =
        createDto.pin ??
        CommonService.getNumberDigits(CommonService.randomIntNumber(9999), 4);
      createDto.accountType = WalletTypesAccountEnum.VAULT;

      walletUser = await this.accountService.createOne(createDto);
    }

    return walletUser;
  }

  // [Wallet Withdrawal]
  async processWithdrawal(withdrawalDto: WalletWithdrawalDto, userId: string) {
    const user = await this.validateAndGetUser(userId);
    await this.validateWithdrawalRequest(withdrawalDto);

    const sourceWallet = await this.validateAndGetFromWallet(
      withdrawalDto.from.toString(),
    );

    const cryptoType = await this.getFireblocksType();
    const fireblocksCrm = await this.ewalletBuilder.getPromiseCrmEventClient(
      EventsNamesCrmEnum.findOneByName,
      IntegrationCryptoEnum.FIREBLOCKS,
    );

    const walletBase = await this.getWalletBase(
      fireblocksCrm._id,
      sourceWallet.name,
    );
    const vaultFrom = await this.getVaultUser(
      sourceWallet.owner.toString(),
      fireblocksCrm._id,
      walletBase,
      sourceWallet.brand.toString(),
    );

    const gasFee = await this.calculateWithdrawalFees(sourceWallet);

    if (sourceWallet.amountCustodial < withdrawalDto.amount + gasFee) {
      throw new BadRequestException(
        `Insufficient funds for withdrawal and fees (${gasFee} fee)`,
      );
    }

    try {
      const withdrawalTx = await cryptoType.createTransaction(
        sourceWallet.accountId,
        withdrawalDto.amount.toString(),
        vaultFrom.accountId,
        withdrawalDto.to.toString(),
        'Withdrawal',
        true,
      );

      await this.updateWalletBalances(
        sourceWallet._id,
        null,
        withdrawalDto.amount + gasFee,
      );
      await this.createWithdrawalTransferEvent(
        sourceWallet,
        withdrawalDto,
        withdrawalTx,
        user,
      );

      return {
        success: true,
        transactionId: withdrawalTx.data.id,
        fee: gasFee,
        status: 'pending',
      };
    } catch (error) {
      this.logger.error(
        'WalletServiceService',
        `Withdrawal failed: ${error.message}`,
      );
      throw new BadRequestException('Failed to process withdrawal');
    }
  }

  private async validateWithdrawalRequest(withdrawalDto: WalletWithdrawalDto) {
    if (!withdrawalDto.amount || withdrawalDto.amount <= 10) {
      throw new BadRequestException(
        'Withdrawal amount must be greater than 10',
      );
    }

    if (!withdrawalDto.to) {
      throw new BadRequestException('Destination address is required');
    }

    if (!withdrawalDto.from) {
      throw new BadRequestException('Source wallet is required');
    }
  }

  private async calculateWithdrawalFees(sourceWallet: AccountDocument) {
    const baseFee = 5;
    const percentageFee = sourceWallet.accountId
      .toLocaleLowerCase()
      .includes('arbitrum')
      ? 0.05
      : 0.03;
    return baseFee + sourceWallet.amountCustodial * percentageFee;
  }

  private async createWithdrawalTransferEvent(
    sourceWallet: AccountDocument,
    withdrawalDto: WalletWithdrawalDto,
    withdrawalResponse: any,
    user: User,
  ) {
    const [withdrawalCategory, pendingStatus, internalPspAccount] =
      await Promise.all([
        this.ewalletBuilder.getPromiseCategoryEventClient(
          EventsNamesCategoryEnum.findOneByNameType,
          {
            slug: 'withdrawal-wallet',
            type: TagEnum.MONETARY_TRANSACTION_TYPE,
          },
        ),
        this.ewalletBuilder.getPromiseStatusEventClient(
          EventsNamesStatusEnum.findOneByName,
          'pending',
        ),
        this.ewalletBuilder.getPromisePspAccountEventClient(
          EventsNamesPspAccountEnum.findOneByName,
          'internal',
        ),
      ]);

    await this.ewalletBuilder.emitTransferEventClient(
      EventsNamesTransferEnum.createOne,
      {
        name: `Withdrawal ${sourceWallet.name}`,
        description: `Withdrawal to ${withdrawalDto.to}`,
        currency: sourceWallet.currency,
        idPayment: withdrawalResponse?.data?.id,
        responsepayment: withdrawalResponse.data,
        amount: withdrawalDto.amount,
        currencyCustodial: sourceWallet.currencyCustodial,
        amountCustodial: withdrawalDto.amount,
        account: sourceWallet._id,
        userCreator: user.id,
        userAccount: sourceWallet.owner,
        typeTransaction: withdrawalCategory._id,
        psp: internalPspAccount.psp,
        pspAccount: internalPspAccount._id,
        operationType: OperationTransactionType.withdrawal,
        statusPayment: StatusCashierEnum.PENDING,
        status: pendingStatus._id,
        brand: sourceWallet.brand,
        crm: sourceWallet.crm,
      } as unknown as TransferCreateDto,
    );
  }
}
