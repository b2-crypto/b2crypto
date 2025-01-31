import TypesAccountEnum from '@account/account/enum/types.account.enum';
import { Traceable } from '@amplication/opentelemetry-nestjs';
import dbIntegrationEnum from '@builder/builders/enums/db-integration.enum';
import { CommonService } from '@common/common';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TransferCreateDto } from '@transfer/transfer/dto/transfer.create.dto';
import { TransferUpdateDto } from '@transfer/transfer/dto/transfer.update.dto';
import {
  Transfer,
  TransferDocument,
} from '@transfer/transfer/entities/mongoose/transfer.schema';
import { isArray, isMongoId } from 'class-validator';
import { ObjectId } from 'mongodb';
import { Aggregate, Model } from 'mongoose';
import { ApproveOrRejectDepositDto } from './dto/approve.or.reject.deposit.dto';
import { OperationTransactionType } from './enum/operation.transaction.type.enum';

@Traceable()
@Injectable()
export class TransferServiceMongooseService extends BasicServiceModel<
  TransferDocument,
  Model<TransferDocument>,
  TransferCreateDto,
  TransferUpdateDto
> {
  constructor(
    @Inject('TRANSFER_MODEL_MONGOOSE')
    private transferModel: Model<TransferDocument>,
  ) {
    super(transferModel);
  }

  async update(id: string, updateTransferDto: TransferUpdateDto) {
    const rta = await super.update(id, updateTransferDto);
    if (rta._id) {
      return this.updateSearchText(id);
    }
    return rta;
  }

  async updateSearchText(id: string): Promise<TransferDocument> {
    const transfer = await this.getTransferData(id);
    transfer.searchText = this.getSearchText(transfer);

    return await super.update(id, transfer);
  }

  async getTransferData(id: string): Promise<Transfer> {
    const transfers = await this.findAll({
      where: {
        _id: id,
      },
      relations: [
        'affiliate',
        'brand',
        'crm',
        'lead',
        'status',
        'department',
        'bank',
        'typeTransaction',
        'pspAccount',
      ],
    });
    return transfers.list[0];
  }

  async createMany(
    createAnyDto: TransferCreateDto[],
  ): Promise<TransferDocument[]> {
    if (this.nameOrm === dbIntegrationEnum.MONGOOSE) {
      try {
        for (let h = 0; h < createAnyDto.length; h++) {
          createAnyDto[h].numericId = null;
        }
        const rta = await this.model.create(createAnyDto);

        return Promise.all(
          rta.map((transfer: TransferDocument) =>
            this.updateSearchText(transfer._id),
          ),
        );
      } catch (err) {
        console.error(err);
      }
    }
    return this.model.save(createAnyDto);
  }

  async checkNumericId() {
    const transferUpdate: TransferUpdateDto[] = [];
    const transfers = await this.transferModel.find();
    for (let h = 0; h < transfers.length; h++) {
      transferUpdate.push({
        id: transfers[h]._id,
      });
    }
    return this.updateMany(
      transferUpdate.map((transfer) => transfer.id),
      transferUpdate,
    );
  }

  async approveRejectTransfer(transfer: ApproveOrRejectDepositDto) {
    if (!transfer.id) {
      throw new BadRequestException('Id is not fined');
    }
    let rta;
    const transferDoc = await this.findOne(transfer.id.toString());
    if (this.nameOrm === dbIntegrationEnum.MONGOOSE) {
      if (!!transferDoc.rejectedAt || !!transferDoc.approvedAt) {
        const txtRejected = !!transferDoc.rejectedAt ? ' was rejected' : '';
        const txtApproved = !!transferDoc.approvedAt ? ' was approved' : '';
        throw new BadRequestException(
          'The transfer' + txtApproved + txtRejected + ".I can't update",
        );
      }
      rta = await this.model.updateOne(
        { _id: transfer.id },
        {
          isApprove: !!transfer.approve,
          approvedAt: transfer.approve ? new Date() : null,
          rejectedAt: transfer.approve ? null : new Date(),
        },
      );
    } else {
      rta = await this.model.update(transfer.id, transfer);
    }
    if (rta.modifiedCount) {
      transferDoc.isApprove = transfer.approve;
      transferDoc.approvedAt = transfer.approve ? new Date() : null;
      transferDoc.rejectedAt = transfer.approve ? null : new Date();
      return transferDoc;
    }
    throw new BadRequestException('No modified transfer');
  }

  getSearchText(transfer: Transfer) {
    return (
      transfer.name +
      CommonService.getSeparatorSearchText() +
      transfer.slug +
      CommonService.getSeparatorSearchText() +
      transfer.idPayment +
      CommonService.getSeparatorSearchText() +
      transfer.numericId +
      CommonService.getSeparatorSearchText() +
      transfer.operationType +
      CommonService.getSeparatorSearchText() +
      transfer.page +
      CommonService.getSeparatorSearchText() +
      transfer.pspAccount?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.statusPayment +
      CommonService.getSeparatorSearchText() +
      transfer.country +
      CommonService.getSeparatorSearchText() +
      transfer.leadTpId +
      CommonService.getSeparatorSearchText() +
      transfer.lead?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.description +
      CommonService.getSeparatorSearchText() +
      transfer.typeTransaction?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.status?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.affiliate?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.brand?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.crm?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.bank?.searchText +
      CommonService.getSeparatorSearchText() +
      transfer.department?.searchText
    );
  }

  async getHistoryCardPurchases(query?: QuerySearchAnyDto, shortData = true) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['typeAccount'] = TypesAccountEnum.CARD;
    query.where['operationType'] = OperationTransactionType.purchase;
    return this.getHistoryGroupById(query, shortData);
  }

  async getHistoryCardWalletDeposits(
    query?: QuerySearchAnyDto,
    shortData = true,
  ) {
    query = query ?? {};
    query.where = query.where ?? {};
    query.where['typeAccount'] = [
      TypesAccountEnum.CARD,
      TypesAccountEnum.WALLET,
    ];
    query.where['operationType'] = OperationTransactionType.deposit;
    return this.getHistoryGroupById(query, shortData);
  }

  async getHistoryGroupById(query: QuerySearchAnyDto, shortData = true) {
    query = query ?? {};
    const aggregate = this.transferModel.aggregate();
    this.setMatch(aggregate, query);
    this.setLookupUser(aggregate);
    this.setOrder(aggregate, query);
    this.setGroup(aggregate, shortData);
    this.setProject(aggregate);
    const list = await aggregate.exec();
    return list;
  }

  private setLookupUser(aggregate: Aggregate<any[]>) {
    aggregate.lookup({
      from: 'users',
      localField: 'userAccount',
      foreignField: '_id',
      as: 'email',
      pipeline: [
        {
          $project: {
            _id: 0,
            email: '$email',
          },
        },
      ],
    });
    aggregate.addFields({
      email: {
        $first: '$email.email',
      },
    });
  }

  private setLookup(aggregate: Aggregate<any[]>, configLookup: any) {
    aggregate.lookup(configLookup);
  }

  private setGroup(
    aggregate: Aggregate<any[]>,
    shortData = false,
    id?: string | JSON,
  ) {
    const configGroup = {
      _id: id ?? '$_id',
      //data: { $push: '$$ROOT' },
    } as any;
    configGroup.numeric_id = { $addToSet: '$numericId' };
    configGroup.email = { $addToSet: '$email' };
    configGroup.amount = { $addToSet: '$amountCustodial' };
    configGroup.currency = { $addToSet: '$currencyCustodial' };
    configGroup.status = { $addToSet: '$statusPayment' };
    configGroup.user_id = {
      $addToSet: '$requestBodyJson.user.id',
    };
    configGroup.card_id = {
      $addToSet: '$requestBodyJson.card.card_id',
    };
    configGroup.card_type = {
      $addToSet: '$typeAccountType',
    };
    configGroup.operation_type = {
      $addToSet: '$operationType',
    };
    configGroup.confirmed_at = {
      $addToSet: '$confirmedAt',
    };
    if (!shortData) {
      configGroup.expiration_date_validation = {
        $addToSet: '$requestBodyJson.extra_data.expiration_date_validation',
      };
      configGroup.pin_validation = {
        $addToSet: '$requestBodyJson.extra_data.pin_validation',
      };
      configGroup.cvv_validation = {
        $addToSet: '$requestBodyJson.extra_data.cvv_validation',
      };
      configGroup.merchant = {
        $addToSet: '$requestBodyJson.merchant.name',
      };
      configGroup.city = {
        $addToSet: '$requestBodyJson.merchant.city',
      };
      configGroup.origin = {
        $addToSet: '$requestBodyJson.transaction.origin',
      };
      configGroup.provider = {
        $addToSet: '$requestBodyJson.card.provider',
      };
      configGroup.last_four = {
        $addToSet: '$requestBodyJson.card.last_four',
      };
    }
    aggregate.group(configGroup);
  }

  private setProject(aggregate: Aggregate<any[]>) {
    aggregate.project({
      _id: 0,
      email: {
        $first: '$email',
      },
      numeric_id: { $first: '$numeric_id' },
      amount: { $first: '$amount' },
      currency: { $first: '$currency' },
      status: { $first: '$status' },
      user_id: {
        $first: '$user_id',
      },
      expiration_date_validation: {
        $first: '$expiration_date_validation',
      },
      pin_validation: {
        $first: '$pin_validation',
      },
      cvv_validation: {
        $first: '$cvv_validation',
      },
      merchant: {
        $first: '$merchant',
      },
      city: {
        $first: '$city',
      },
      origin: {
        $first: '$origin',
      },
      provider: {
        $first: '$provider',
      },
      last_four: {
        $first: '$last_four',
      },
      card_id: {
        $first: '$card_id',
      },
      card_type: {
        $first: '$card_type',
      },
      operation_type: {
        $first: '$operation_type',
      },
      confirmed_at: {
        $first: '$confirmed_at',
      },
    });
  }

  private setMatch(aggregate: Aggregate<any[]>, query: QuerySearchAnyDto) {
    if (query.where) {
      for (const key in query.where) {
        if (isArray(query.where[key])) {
          if (key === '$or') {
            for (const attrOR in query.where[key]) {
              for (const attr in query.where[key][attrOR]) {
                query.where[key][attrOR][attr] = CommonService.checkDateAttr(
                  query.where[key][attrOR][attr],
                );
              }
            }
            continue;
          }
          query.where[key] = {
            $in: query.where[key].map((item) => {
              if (isMongoId(item)) {
                return new ObjectId(item);
              }
              return item;
            }),
          };
        } else if (isMongoId(query.where[key])) {
          query.where[key] = new ObjectId(query.where[key]);
        } else if (query.where[key]['start'] || query.where[key]['end']) {
          query.where[key] = CommonService.checkDateAttr(query.where[key]);
        }
      }
      aggregate.match(query.where);
    }
  }

  private setOrder(aggregate: Aggregate<any[]>, query: QuerySearchAnyDto) {
    if (query.order) {
      const sort = {};
      for (const order of query.order) {
        sort[order[0]] = order[1];
      }
      aggregate.sort(sort);
    }
  }
}
