enum EventsNamesTransferEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'TRANSFER',
  download = 'TRANSFER.DOWNLOAD',
  //
  createMany = 'TRANSFER.CREATE.MANY',
  createOne = 'TRANSFER.CREATE.ONE',
  createOneDepositLink = 'TRANSFER.CREATE.ONE.LINK',
  createOneWebhok = 'TRANSFER.CREATE.ONE.WEBHOOK',
  createOneWebhook = 'TRANSFER.CREATE.ONE.WEBHOOK',
  updateMany = 'TRANSFER.UPDATE.MANY',
  updateOne = 'TRANSFER.UPDATE.ONE',
  findAll = 'TRANSFER.FIND.ALL',
  findOneById = 'TRANSFER.FIND.ONE.BY.ID',
  findByLead = 'TRANSFER.FIND.ONE.BY.LEAD',
  deleteMany = 'TRANSFER.DELETE.MANY',
  deleteOneById = 'TRANSFER.DELETE.ONE.BY.ID',

  findOneByIdToCrmSend = 'TRANSFER.FIND.ONE.BY.ID.To.CRM.SEND',
  checkTransfersForPspAccountStats = 'TRANSFER.CHECK.FOR.PSP.ACCOUNT.STATS',
  checkTransfersForPspStats = 'TRANSFER.CHECK.FOR.PSP.STATS',
  checkTransferStatsByQuery = 'TRANSFER.CHECK.STATS.BY.QUERY',
  checkTransferInCashierByStatus = 'TRANSFER.CHECK.CASHIER.STATUS',
  checkTransferInB2BinPay = 'TRANSFER.CHECK.B2BINPAY',
  sendLast6hHistoryCardPurchases = 'TRANSFER.SEND.LAST.6H.HISTORY.CARD.PURCHASE',
  sendLast6hHistoryCardWalletDeposits = 'TRANSFER.SEND.LAST.6H.HISTORY.CARD.WALLET.DEPOSITS',
}

export default EventsNamesTransferEnum;
