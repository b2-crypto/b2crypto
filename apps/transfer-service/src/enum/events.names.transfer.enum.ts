enum EventsNamesTransferEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'TRANSFER',
  download = 'TRANSFER.DOWNLOAD',
  //
  createMany = 'TRANSFER.CREATE.MANY.JOBS',
  createOne = 'TRANSFER.CREATE.ONE.JOBS',
  createOneDepositLink = 'TRANSFER.CREATE.ONE.LINK.JOBS',
  createOneWebhok = 'TRANSFER.CREATE.ONE.WEBHOOK.JOBS',
  createOneMigration = 'TRANSFER.CREATE.ONE.MIGRATION.JOBS',
  createOneWebhook = 'TRANSFER.CREATE.ONE.WEBHOOK.JOBS',
  updateMany = 'TRANSFER.UPDATE.MANY.JOBS',
  updateOne = 'TRANSFER.UPDATE.ONE.JOBS',
  findAll = 'TRANSFER.FIND.ALL.JOBS',
  findOneById = 'TRANSFER.FIND.ONE.BY.ID.JOBS',
  findByLead = 'TRANSFER.FIND.ONE.BY.LEAD.JOBS',
  deleteMany = 'TRANSFER.DELETE.MANY.JOBS',
  deleteOneById = 'TRANSFER.DELETE.ONE.BY.ID.JOBS',

  findOneByIdToCrmSend = 'TRANSFER.FIND.ONE.BY.ID.To.CRM.SEND.JOBS',
  checkTransfersForPspAccountStats = 'TRANSFER.CHECK.FOR.PSP.ACCOUNT.STATS.JOBS',
  checkTransfersForPspStats = 'TRANSFER.CHECK.FOR.PSP.STATS.JOBS',
  checkTransferStatsByQuery = 'TRANSFER.CHECK.STATS.BY.QUERY.JOBS',
  checkTransferInCashierByStatus = 'TRANSFER.CHECK.CASHIER.STATUS.JOBS',
  checkTransferInB2BinPay = 'TRANSFER.CHECK.B2BINPAY.JOBS',
  sendLast6hHistoryCardPurchases = 'TRANSFER.SEND.LAST.6H.HISTORY.CARD.PURCHASE.JOBS',
  sendLast6hHistoryCardWalletDeposits = 'TRANSFER.SEND.LAST.6H.HISTORY.CARD.WALLET.DEPOSITS.JOBS',
  sendLast6hHistory = 'TRANSFER.SEND.LAST.6H.HISTORY.JOBS',
}

export default EventsNamesTransferEnum;
