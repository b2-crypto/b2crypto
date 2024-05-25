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
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ClientProxy, Ctx, RmqContext } from '@nestjs/microservices';
import { StatusDocument } from '@status/status/entities/mongoose/status.schema';

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
    throw new Error('Method not implemented.');
  }
  async findAll(
    query: QuerySearchAnyDto,
    context?: any,
  ): Promise<ResponsePaginator<AccountDocument>> {
    return this.lib.findAll(query);
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
    return this.lib.update(updateDto.id ?? updateDto._id, updateDto);
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
    throw new Error('Method not implemented.');
  }
  findAllEvent(query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  downloadEvent(query: QuerySearchAnyDto, @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  findOneByIdEvent(id: string, @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  createOneEvent(createActivityDto: CreateAnyDto, @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  createManyEvent(createActivitysDto: CreateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  updateOneEvent(updateActivityDto: UpdateAnyDto, @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  updateManyEvent(updateActivitysDto: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  deleteManyByIdEvent(ids: UpdateAnyDto[], @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
  deleteOneByIdEvent(id: string, @Ctx() ctx: RmqContext) {
    throw new Error('Method not implemented.');
  }
}
