import { Prop } from '@nestjs/mongoose';

export class SumsubReviewResult {
  @Prop()
  reviewAnswer: string;
}

export class SumsubApplicantReviewedSchema {
  @Prop()
  applicantId: string;
  @Prop()
  inspectionId: string;
  @Prop()
  correlationId: string;
  @Prop()
  externalUserId: string;
  @Prop()
  levelName: string;
  @Prop()
  type: string;
  @Prop()
  reviewResult: SumsubReviewResult;
  @Prop()
  reviewStatus: string;
  @Prop()
  createdAtMs: string;
}

export class SumsubApplicantPendingSchema {
  @Prop()
  applicantId: string;
  @Prop()
  inspectionId: string;
  @Prop()
  applicantType: string;
  @Prop()
  correlationId: string;
  @Prop()
  levelName: string;
  @Prop()
  externalUserId: string;
  @Prop()
  type: string;
  @Prop()
  sandboxMode: string;
  @Prop()
  reviewStatus: string;
  @Prop()
  createdAtMs: string;
  @Prop()
  clientId: string;
}

export class SumsubApplicantOnHoldSchema {
  @Prop()
  applicantId: string;
  @Prop()
  inspectionId: string;
  @Prop()
  applicantType: string;
  @Prop()
  correlationId: string;
  @Prop()
  levelName: string;
  @Prop()
  externalUserId: string;
  @Prop()
  type: string;
  @Prop()
  sandboxMode: string;
  @Prop()
  reviewResult: SumsubReviewResult;
  @Prop()
  reviewStatus: string;
  @Prop()
  createdAtMs: string;
  @Prop()
  clientId: string;
}

export class UserVerifyIdentitySchema {
  reviewed: SumsubApplicantReviewedSchema;
  pending: SumsubApplicantPendingSchema;
  onHold: SumsubApplicantOnHoldSchema;
}
