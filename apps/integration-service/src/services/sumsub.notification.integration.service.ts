import { BuildersService } from '@builder/builders';
import { SumsubApplicantOnHold } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.onhold.dto';
import { SumsubApplicantPending } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.pending.dto';
import { SumsubApplicantReviewed } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.reviewed.dto';
import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { UserVerifyIdentitySchema } from '@user/user/entities/mongoose/user.verify.identity.schema';
import { UserEntity } from '@user/user/entities/user.entity';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';

@Injectable()
export class SumsubNotificationIntegrationService {
  constructor(private readonly builder: BuildersService) {}

  async validateClient(clientId: string) {
    const client = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      clientId,
    );
    if (!client) {
      throw new Error('Client not found');
    }

    if (client.slug !== 'sumsub') {
      throw new UnauthorizedException('Invalid client');
    }
  }
  async updateUserByReviewed(notification: SumsubApplicantReviewed) {
    const user = await this.builder.getPromiseUserEventClient<UserEntity>(
      EventsNamesUserEnum.findOneById,
      notification.externalUserId,
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.verifyIdentityResponse =
      user.verifyIdentityResponse ?? new UserVerifyIdentitySchema();
    user.verifyIdentityResponse.reviewed = notification;
    if (notification.reviewStatus === 'completed') {
      user.verifyIdentity = notification.reviewResult.reviewAnswer === 'GREEN';
    }
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: user._id,
      verifyIdentityResponse: user.verifyIdentityResponse,
      verifyIdentityStatus: notification.reviewStatus,
      verifyIdentityLevelName: notification.levelName,
      verifyIdentity: user.verifyIdentity,
    });

    return user;
  }
  async updateUserByPending(notification: SumsubApplicantPending) {
    const user = await this.builder.getPromiseUserEventClient<UserEntity>(
      EventsNamesUserEnum.findOneById,
      notification.externalUserId,
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.verifyIdentityResponse =
      user.verifyIdentityResponse ?? new UserVerifyIdentitySchema();
    user.verifyIdentityResponse.pending = notification;
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: user._id,
      verifyIdentityResponse: user.verifyIdentityResponse,
      verifyIdentityStatus: notification.reviewStatus,
    });

    return user;
  }
  async updateUserByOnHold(notification: SumsubApplicantOnHold) {
    const user = await this.builder.getPromiseUserEventClient<UserEntity>(
      EventsNamesUserEnum.findOneById,
      notification.externalUserId,
    );
    if (!user) {
      throw new BadRequestException('User not found');
    }
    user.verifyIdentityResponse =
      user.verifyIdentityResponse ?? new UserVerifyIdentitySchema();
    user.verifyIdentityResponse.reviewed = notification;
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: user._id,
      verifyIdentityResponse: user.verifyIdentityResponse,
      verifyIdentityStatus: notification.reviewStatus,
      verifyIdentityLevelName: notification.levelName,
    });

    return user;
  }
}
