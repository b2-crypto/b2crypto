import { check } from 'k6';
import http from 'k6/http';

export default function () {
  const baseUrl = 'https://apitest.b2fintech.com';
  const baseHeaders = {
    'Content-Type': 'application/json',
    'b2crypto-key':
      '$2b$10$lMFwKwDQG2eX71LEcUeywetWyQyvcZA5XVTwMxorvddQQ/uDS3qy2',
  };

  const signInPath = '/auth/sign-in';
  const signInPayload = JSON.stringify({
    email: 'apoveda25@yopmail.com',
    password: 'Secret123',
  });
  const signInParams = {
    headers: baseHeaders,
  };
  const signInUrl = `${baseUrl}${signInPath}`;

  const signInRes = http.post(signInUrl, signInPayload, signInParams);

  check(signInRes, {
    'is status ok': (r) =>
      r.status === 200 || r.status === 201 || r.status === 301,
  });

  const signInResJson = signInRes.json();

  const transactionsAuthorizationsPath = '/transactions/authorizations';
  const transactionsAuthorizationsPayload = JSON.stringify({
    amount: {
      details: [
        {
          type: 'BASE',
          currency: 'COP',
          amount: '0.00',
          name: 'BASE',
        },
      ],
      transaction: {
        total: '0.00',
        currency: 'USD',
      },
      local: {
        total: '0.00',
        currency: 'COP',
      },
      settlement: {
        total: '0.00',
        currency: 'USD',
      },
    },
    extra_data: {
      cardholder_presence: 'NOT_PRESENT_ECOMMERCE',
      expiration_date_presence: 'PRESENT',
      expiration_date_validation: 'VALID',
      pin_validation: 'VALID',
      cvv_validation: 'MATCHING',
      pin_presence: 'NOT_PRESENT',
      card_presence: 'NOT_PRESENT',
      tokenization_wallet_name: null,
      tokenization_wallet_id: null,
      cardholder_verification_method: null,
      cvv_presence: 'PRESENT',
      function_code: 'STANDARD',
    },
    merchant: {
      country: 'USA',
      address: 'MIRAMAR USA',
      city: 'MIRAMAR',
      name: 'SPIRIT AIR ONLINE SALE',
      id: '9508698116     ',
      mcc: '3260',
      terminal_id: '98116699        ',
    },
    user: {
      id: 'usr-2gmvOrWhtLbD3QQP2ZW29Iamx40',
    },
    transaction: {
      original_transaction_id: null,
      origin: 'INTERNATIONAL',
      entry_mode: 'MANUAL',
      source: 'ONLINE',
      type: 'PURCHASE',
      network: 'MASTERCARD',
      point_type: 'ECOMMERCE',
      country_code: 'USA',
      local_date_time: '2024-08-22T21:32:47',
      id: 'ctx-2l2SdkRbkocB3rbo9bQC1Z9AH2V',
    },
    card: {
      product_type: 'CREDIT',
      last_four: '6322',
      provider: 'MASTERCARD',
      id: 'crd-2fpT0TVUgFM76qOHvEGgURiBcuB',
    },
    idempotency: '668cf2ea-74c4-49fd-be7e-80254bd6c11e',
  });
  const transactionsAuthorizationsParams = {
    headers: {
      ...baseHeaders,
      Authorization: `Bearer ${signInResJson.data.access_token}`,
    },
  };
  const transactionsAuthorizationsUrl = `${baseUrl}${transactionsAuthorizationsPath}`;

  const transactionsAuthorizationsRes = http.post(
    transactionsAuthorizationsUrl,
    transactionsAuthorizationsPayload,
    transactionsAuthorizationsParams,
  );

  check(transactionsAuthorizationsRes, {
    'is status 200': (r) => r.status === 200,
  });
}
