import { WithdrawalErrorCode } from "../enum/withdrawalErrorCode";
import { FireblocksErrorResponse, WithdrawalErrorDetails } from "../interfaces/withdrawalErrors";


export class WithdrawalError extends Error {
  constructor(
    public code: WithdrawalErrorCode,
    message: string,
    public details?: WithdrawalErrorDetails,
    public originalError?: FireblocksErrorResponse
  ) {
    super(message);
    this.name = 'WithdrawalError';
  }
}