import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { IpAddressCreateDto } from '@ip-address/ip-address/dto/ip-address.create.dto';
import { IpAddressUpdateDto } from '@ip-address/ip-address/dto/ip-address.update.dto';
import { IpAddressDocument } from '@ip-address/ip-address/entities/mongoose/ip-address.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

@Traceable()
@Injectable()
export class IpAddressServiceMongooseService extends BasicServiceModel<
  IpAddressDocument,
  Model<IpAddressDocument>,
  IpAddressCreateDto,
  IpAddressUpdateDto
> {
  constructor(
    @Inject('IP_ADDRESS_MODEL_MONGOOSE')
    ipAddressModel: Model<IpAddressDocument>,
  ) {
    super(ipAddressModel);
  }
}
