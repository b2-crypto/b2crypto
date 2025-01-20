import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';

export const CommissionsTypeMap = new Map<string, string>([
  [OperationTransactionType.refund, OperationTransactionType.refund],
  [
    OperationTransactionType.reversal_refund,
    OperationTransactionType.reversal_refund,
  ],
]);

export const CommissionsTypePreviousMap = new Map<string, string>([
  [OperationTransactionType.refund, OperationTransactionType.purchase],
  [OperationTransactionType.reversal_refund, OperationTransactionType.refund],
]);
