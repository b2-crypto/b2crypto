import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { IpAddressCreateDto } from '@ip-address/ip-address/dto/ip-address.create.dto';
import { IpAddressUpdateDto } from '@ip-address/ip-address/dto/ip-address.update.dto';
import { IpAddressDocument } from '@ip-address/ip-address/entities/mongoose/ip-address.schema';
import { Inject, Injectable } from '@nestjs/common';
import { Model } from 'mongoose';

import { Traceable } from '@amplication/opentelemetry-nestjs';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';

@Traceable()
@Injectable()
export class IpAddressServiceMongooseService extends BasicServiceModel<
  IpAddressDocument,
  Model<IpAddressDocument>,
  IpAddressCreateDto,
  IpAddressUpdateDto
> {
  constructor(
    @Inject(WINSTON_MODULE_PROVIDER) protected readonly logger: Logger,
    @Inject('IP_ADDRESS_MODEL_MONGOOSE')
    ipAddressModel: Model<IpAddressDocument>,
  ) {
    super(logger, ipAddressModel);
  }
}
