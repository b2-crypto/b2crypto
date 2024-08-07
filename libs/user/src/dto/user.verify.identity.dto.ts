import { SumsubApplicantOnHold } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.onhold.dto';
import { SumsubApplicantPending } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.pending.dto';
import { SumsubApplicantReviewed } from '@integration/integration/identity/generic/domain/process/sumsub.applicant.reviewed.dto';

export default class UserVerifyIdentityDto {
  reviewed: SumsubApplicantReviewed;
  pending: SumsubApplicantPending;
  onHold: SumsubApplicantOnHold;
}
