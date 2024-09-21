import { AccountServiceMongooseService } from '@account/account/account-service-mongoose.service';
import { AccountCreateDto } from '@account/account/dto/account.create.dto';
import { AccountUpdateDto } from '@account/account/dto/account.update.dto';
import { AccountDocument } from '@account/account/entities/mongoose/account.schema';
import { BuildersService } from '@builder/builders';
import { ResponsePaginator } from '@common/common/interfaces/response-pagination.interface';
import { BasicMicroserviceService } from '@common/common/models/basic.microservices.service';
import { CreateAnyDto } from '@common/common/models/create-any.dto';
import { QuerySearchAnyDto } from '@common/common/models/query_search-any.dto';
import { UpdateAnyDto } from '@common/common/models/update-any.dto';
import {
  BadRequestException,
  Inject,
  Injectable,
  NotImplementedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, Ctx, RmqContext } from '@nestjs/microservices';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';
import EventsNamesStatusEnum from 'apps/status-service/src/enum/events.names.status.enum';

@Injectable()
export class AccountServiceService
  implements BasicMicroserviceService<AccountDocument>
{
  constructor(
    private configService: ConfigService,
    @Inject(BuildersService)
    private readonly builder: BuildersService,
    @Inject(AccountServiceMongooseService)
    private lib: AccountServiceMongooseService,
  ) {}
  async download(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<AccountDocument[]> {
    throw new NotImplementedException('Method not implemented.');
  }
  async getBalanceByAccountType(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByAccountType(query);
  }

  async getBalanceByOwnerByCard(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByOwnerByCard(query);
  }

  async getBalanceByOwnerByWallet(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByOwnerByWallet(query);
  }

  async getBalanceByAccountByCard(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByAccountByCard(query);
  }

  async getBalanceByAccountByWallet(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<any[]> {
    return this.lib.getBalanceByAccountByWallet(query);
  }

  async findAll(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<ResponsePaginator<AccountDocument>> {
    return this.lib.findAll(query);
  }

  async count(query: QuerySearchAnyDto, context?: any): Promise<number> {
    return this.lib.count(query);
  }
  async findOneById(id: string, context?: any): Promise<AccountDocument> {
    return this.lib.findOne(id);
  }
  async createOne(
    createDto: AccountCreateDto,
    context?: any,
  ): Promise<AccountDocument> {
    return this.lib.create(createDto);
  }
  async createMany(
    createDto: AccountCreateDto[],
    context?: any,
  ): Promise<AccountDocument[]> {
    return this.lib.createMany(createDto);
  }
  async updateOne(
    updateDto: AccountUpdateDto,
    context?: any,
  ): Promise<AccountDocument> {
    const id = updateDto.id ?? updateDto._id;
    const account = await this.findOneById(id);
    const statusDisable = await this.builder.getPromiseStatusEventClient(
      EventsNamesStatusEnum.findOneByName,
      'disable',
    );
    if (account.status === statusDisable._id) {
      throw new BadRequestException('The account was disabled');
    }
    return this.lib.update(id, updateDto);
  }
  async customUpdateOne(updateRequest: any): Promise<AccountDocument> {
    const id = updateRequest.id ?? updateRequest._id;
    delete updateRequest.id;
    delete updateRequest._id;
    return this.lib.update(id, updateRequest);
  }
  async updateMany(
    updateDto: AccountUpdateDto[],
    context?: any,
  ): Promise<AccountDocument[]> {
    return this.lib.updateMany(
      updateDto.map((data) => data.id),
      updateDto,
    );
  }
  async deleteManyById(
    updateDto: UpdateAnyDto[],
    context?: any,
  ): Promise<AccountDocument[]> {
    return this.lib.removeMany(updateDto.map((data) => data.id));
  }
  async deleteOneById(id: string, context?: any): Promise<AccountDocument> {
    return this.lib.remove(id);
  }
  getRta(rta: any, @Ctx() ctx: any) {
    throw new NotImplementedException('Method not implemented.');
  }
  findAllEvent(query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  downloadEvent(query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  findOneByIdEvent(id: string, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  createOneEvent(createAccountDto: CreateAnyDto, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  createManyEvent(
    createAccountsDto: AccountCreateDto[],
    @Ctx() ctx: RmqContext,
  ) {
    throw this.createMany(createAccountsDto);
  }
  updateOneEvent(updateAccountDto: UpdateAnyDto, @Ctx() ctx: RmqContext) {
    return this.updateOne(updateAccountDto);
  }
  updateManyEvent(updateAccountsDto: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  deleteManyByIdEvent(ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
  deleteOneByIdEvent(id: string, @Ctx() ctx: RmqContext) {
    throw new NotImplementedException('Method not implemented.');
  }
}
