import { AccountDocument } from '@account/account/entities/mongoose/account.schema';

export interface IData {
  name: string;
  network: INetwork[];
}

export interface INetwork {
  name: string;
  wallets: AccountDocument[];
}
