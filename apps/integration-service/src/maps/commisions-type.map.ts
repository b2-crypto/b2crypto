import { OperationTransactionType } from '@transfer/transfer/enum/operation.transaction.type.enum';

export const CommissionsTypeDescriptionMap = new Map<string, string>([
  [OperationTransactionType.withdrawal, 'Commision to B2Fintech withdrawal'],
  [OperationTransactionType.purchase, 'Commision to B2Fintech purchase'],
  [
    OperationTransactionType.reversal_purchase,
    'Commision to B2Fintech reversal purchase',
  ],
  [OperationTransactionType.refund, 'Commision to B2Fintech refund'],
  [
    OperationTransactionType.reversal_refund,
    'Commision to B2Fintech reversal refund',
  ],
]);

export const CommissionsTypePreviousMap = new Map<string, string>([
  [
    OperationTransactionType.reversal_purchase,
    OperationTransactionType.purchase,
  ],
  [OperationTransactionType.refund, OperationTransactionType.purchase],
  [OperationTransactionType.reversal_refund, OperationTransactionType.refund],
]);
