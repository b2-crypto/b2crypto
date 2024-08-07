export enum SumsubEnum {
  SUMSUB_HEADER_TIMESTAMP = 'X-App-Access-Ts',
  SUMSUB_HEADER_SIGNATURE = 'X-App-Access-Sig',
  SUMSUB_HEADER_APP_TOKEN = 'X-App-Token',
  SUMSUB_ISSUE_TOKEN_PATH = '/issue-sumsub-token',
  SUMSUB_CLIENT_PROXY = 'SUMSUB.CLIENT.PROXY',
  SUMSUB_ISSUE_TOKEN_QUEUE = 'issue-token',
}

export enum SumsubApplicantLevels {
  individual_level1 = 'level1',
  individual_basicKYCLevel = 'basic-kyc-level',
  company_level1corporate = 'level1corporate',
  company_autoKYB = 'Auto-KYB',
  company_basicKYBLevel = 'basic-kyb-level',
}
