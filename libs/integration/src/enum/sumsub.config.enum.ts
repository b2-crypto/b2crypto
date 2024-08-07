export enum SumsubConfigEnum {
  SUMSUB_NOTIFICATION_REVIEWED_PATH = 'notifications/reviewed',
  SUMSUB_NOTIFICATION_PENDING_PATH = 'notifications/pending',
  SUMSUB_NOTIFICATION_ON_HOLD_PATH = 'notifications/onHold',
  SUMSUB_APIKEY_HEADER = 'b2crypto-key',
  SUMSUB_SIGNATURE_HEADER = 'X-Payload-Digest-Alg',
}

export enum SumsubProcessEnum {
  Reviewed = 'applicantReviewed',
  OnHold = 'applicantOnHold',
  Pending = 'applicantPending',
}
