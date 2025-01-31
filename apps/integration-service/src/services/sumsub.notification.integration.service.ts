import { Traceable } from '@amplication/opentelemetry-nestjs';
import { BuildersService } from '@builder/builders';
import { SumsubApplicantOnHold } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.onhold.dto';
import { SumsubApplicantPending } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.pending.dto';
import { SumsubApplicantReviewed } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.reviewed.dto';
import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserVerifyIdentitySchema } from '@user/user/entities/mongoose/user.verify.identity.schema';
import { UserEntity } from '@user/user/entities/user.entity';
import EventsNamesUserEnum from 'apps/user-service/src/enum/events.names.user.enum';
import { isMongoId } from 'class-validator';

@Traceable()
@Injectable()
export class SumsubNotificationIntegrationService {
  constructor(private readonly builder: BuildersService) {}

  async validateClient(clientId: string) {
    const client = await this.builder.getPromiseUserEventClient(
      EventsNamesUserEnum.findOneById,
      clientId,
    );
    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.slug !== 'sumsub') {
      throw new UnauthorizedException('Invalid client');
    }
  }
  async updateUserByReviewed(notification: SumsubApplicantReviewed) {
    if (!isMongoId(notification.externalUserId)) {
      Logger.error(
        `User id "${notification.externalUserId}" isn't valid`,
        'Reviewed.SumsubNotificationIntegrationService',
      );
      return null;
    }
    const user = await this.builder.getPromiseUserEventClient<UserEntity>(
      EventsNamesUserEnum.findOneById,
      notification.externalUserId,
    );
    if (!user) {
      Logger.error(
        'User not found',
        'Reviewed.SumsubNotificationIntegrationService',
      );
      return null;
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
    Logger.log('User Updated', 'Reviewed.SumsubNotificationIntegrationService');

    return user;
  }
  async updateUserByPending(notification: SumsubApplicantPending) {
    if (!isMongoId(notification.externalUserId)) {
      Logger.error(
        `User id "${notification.externalUserId}" isn't valid`,
        'Reviewed.SumsubNotificationIntegrationService',
      );
      return null;
    }
    const user = await this.builder.getPromiseUserEventClient<UserEntity>(
      EventsNamesUserEnum.findOneById,
      notification.externalUserId,
    );
    if (!user) {
      Logger.error(
        'User not found',
        'Pending.SumsubNotificationIntegrationService',
      );
      return null;
    }
    user.verifyIdentityResponse =
      user.verifyIdentityResponse ?? new UserVerifyIdentitySchema();
    user.verifyIdentityResponse.pending = notification;
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: user._id,
      verifyIdentityResponse: user.verifyIdentityResponse,
      verifyIdentityStatus: notification.reviewStatus,
    });
    Logger.log('User Updated', 'Pending.SumsubNotificationIntegrationService');

    return user;
  }
  async updateUserByOnHold(notification: SumsubApplicantOnHold) {
    if (!isMongoId(notification.externalUserId)) {
      Logger.error(
        `User id "${notification.externalUserId}" isn't valid`,
        'Reviewed.SumsubNotificationIntegrationService',
      );
      return null;
    }
    const user = await this.builder.getPromiseUserEventClient<UserEntity>(
      EventsNamesUserEnum.findOneById,
      notification.externalUserId,
    );
    if (!user) {
      Logger.error(
        'User not found',
        'OnHold.SumsubNotificationIntegrationService',
      );
      return null;
    }
    user.verifyIdentityResponse =
      user.verifyIdentityResponse ?? new UserVerifyIdentitySchema();
    user.verifyIdentityResponse.onHold = notification;
    this.builder.emitUserEventClient(EventsNamesUserEnum.updateOne, {
      id: user._id,
      verifyIdentityResponse: user.verifyIdentityResponse,
      verifyIdentityStatus: notification.reviewStatus,
      verifyIdentityLevelName: notification.levelName,
    });
    Logger.log('User Updated', 'OnHold.SumsubNotificationIntegrationService');

    return user;
  }
}
