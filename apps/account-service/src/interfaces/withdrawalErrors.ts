import { NetworkEnum } from "../enum/network.enum";

export interface WithdrawalErrorDetails {
    message?: string;
    code?: string;
    network?: string;
    address?: string;
    walletId?: string;
    amount?: number;

    available?: number;
    required?: number;
    fees?: {
        networkFee?: number;
        baseFee?: number;
    };

    details?: string;
    originalMessage?: string;
    originalError?: string | Error | unknown;
    stack?: string;
    errorCode?: string;

    preorderId?: string;
    response?: unknown;
    userId?: string;
    timestamp?: Date;

    transactionId?: string;
    deficit?: number;
    reason?: string;
    activePreorders?: number;

    supportedNetworks?: string[];

    providedNetworkEnum?: NetworkEnum;
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

