import { SumsubReviewResult } from './sumsub.reviewed.result.dto';

export interface SumsubApplicantReviewed {
  applicantId: string;
  inspectionId: string;
  correlationId: string;
  externalUserId: string;
  levelName: string;
  type: string;
  reviewResult: SumsubReviewResult;
  reviewStatus: string;
  createdAtMs: string;
}
