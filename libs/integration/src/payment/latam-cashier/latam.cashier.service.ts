import { IntegrationPaymentService } from '../generic/integration.payment.service';
import { LatamCashierUrlToPayRequest } from './domain/latamcashier.url.to.pay.request';
import { LatamCashierUrlToPayResponse } from './domain/latamcashier.url.to.pay.response';

export class LatamCashierService extends IntegrationPaymentService {
  async sendPayment<TRequest, TResponse>(req: TRequest): Promise<TResponse> {
    //this.routesMap.api.sendPayment;
    throw new Error('Method not implemented.');
  }

  async getPayment<TRequest, TResponse>(tpId: TRequest): Promise<TResponse> {
    //TODO[hender] Add url to get one transfer from cashier
    const url = ``;
    //this.routesMap.api.getPayment;
    throw new Error('Method not implemented.');
  }

  async getUrlToPay(
    request: LatamCashierUrlToPayRequest,
  ): Promise<LatamCashierUrlToPayResponse> {
    //this.routesMap.api.getUrlToPay;
    //throw new Error('Method not implemented.');
    //TODO[hender] Add url to pay in cashier
    const url = ``;
    return { url };
  }
}
