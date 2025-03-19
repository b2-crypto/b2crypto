export interface IExchangeRate {
    success: boolean;
    query: IQuery;
    info: IInfo;
    date: string;
    result: number;
}

export interface IQuery {
    from: string;
    to: string;
    amount: number;
}

export interface IInfo {
    timestamp: number;
    rate: number;
}

export interface TrmValue {
    value: number;
}

export interface TrmResponse {
    id: string;
    value: TrmValue;
    validStartDatetime: string;
    validStartTimezone: string;
    validEndDatetime: string;
    validEndTimezone: string;
    currency: string;
    isDeleted: boolean;
    createdAtDatetime: string;
    createdAtTimezone: string;
    updatedAtDatetime: string | null;
    updatedAtTimezone: string | null;
    deletedAtDatetime: string | null;
    deletedAtTimezone: string | null;
    createdBy: string;
    updatedBy: string | null;
    deletedBy: string | null;
}

export interface TrmResult {
    value: number;
    source: 'cache' | 'api' | 'default';
    updated: boolean;
    timestamp: Date;
}