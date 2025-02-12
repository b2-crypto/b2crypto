export interface WithdrawalErrorDetails {
    walletId?: string;
    address?: string;
    available?: number;
    required?: number;
    network?: string;
    preorderId?: string;
    details?: string;
    vaultAccountId?: string;
    fees?: {
        networkFee: number;
        baseFee: number;
    };
    originalMessage?: string;
    errorCode?: string;
}

export interface FireblocksErrorResponse {
    response?: {
        data?: {
            message?: string;
            code?: string;
        };
    };
    message?: string;
}

export interface ValidationResponse {
    isValid: boolean;
    message?: string;
}

