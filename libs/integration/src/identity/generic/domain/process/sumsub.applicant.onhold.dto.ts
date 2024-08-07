import { SumsubReviewResult } from './sumsub.reviewed.result.dto';

export interface SumsubApplicantOnHold {
  applicantId: string;
  inspectionId: string;
  applicantType: string;
  correlationId: string;
  levelName: string;
  externalUserId: string;
  type: string;
  sandboxMode: string;
  reviewResult: SumsubReviewResult;
  reviewStatus: string;
  createdAtMs: string;
  clientId: string;
}
