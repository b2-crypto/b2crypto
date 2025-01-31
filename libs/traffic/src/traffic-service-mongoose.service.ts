import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BasicServiceModel } from '@common/common/models/basic-service.model';
import { Inject, Injectable } from '@nestjs/common';
import { TrafficCreateDto } from '@traffic/traffic/dto/traffic.create.dto';
import { TrafficUpdateDto } from '@traffic/traffic/dto/traffic.update.dto';
import { TrafficDocument } from '@traffic/traffic/entities/mongoose/traffic.schema';
import { Model } from 'mongoose';

@Traceable()
@Injectable()
export class TrafficServiceMongooseService extends BasicServiceModel<
  TrafficDocument,
  Model<TrafficDocument>,
  TrafficCreateDto,
  TrafficUpdateDto
> {
  constructor(
    @Inject('TRAFFIC_MODEL_MONGOOSE')
    trafficModel: Model<TrafficDocument>,
  ) {
    super(trafficModel);
  }
}
