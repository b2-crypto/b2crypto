enum EventsNamesAccountEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'CARD',
  download = 'ACCOUNT.DOWNLOAD',
  //
  count = 'ACCOUNT.COUNT',
  createMany = 'ACCOUNT.CREATE.MANY',
  createOne = 'ACCOUNT.CREATE.ONE',
  createOneWallet = 'ACCOUNT.CREATE.ONE.WALLET',
  updateMany = 'ACCOUNT.UPDATE.MANY',
  updateOne = 'ACCOUNT.UPDATE.ONE',
  customUpdateOne = 'ACCOUNT.CUSTOM.UPDATE.ONE',
  updateAmount = 'ACCOUNT.UPDATE.AMOUNT',
  updateOneByTpId = 'ACCOUNT.UPDATE.ONE.BY.TP.ID',
  findAll = 'FILE.ACCOUNT.ALL',
  findOneById = 'ACCOUNT.FIND.ONE.BY.ID',
  findOneByCardId = 'ACCOUNT.FIND.ONE.BY.CARD.ID',
  deleteMany = 'ACCOUNT.DELETE.MANY',
  deleteOneById = 'ACCOUNT.DELETE.ONE.BY.ID',

  sendBalanceReport = 'ACCOUNT.SEND.BALANCE.REPORT',

  pomeloTransaction = 'CARD.POMELO.TRANSACTION',

  setBalanceByCard = 'SET.BALANCE.BY.CARD',
  mingrateOne = 'CARD.MIGRATE.ONE',
  findAllCardsToMigrate = 'FIND.CARD.ALL',

  findOneByTpId = 'CARD.FIND.ONE.BY.TP.ID',
  getAffiliatesFromCards = 'CARD.FIND.AFFILIATES',
  addCardFromAffiliate = 'CARD.CREATE.FROM.AFFILIATE',
  checkCardsCreatedInPomelo = 'CARD.CHECK.CREATED.IN.POMELO',
  checkCardsForAffiliateStats = 'CARD.CHECK.FOR.AFFILIATE.STATS',
  checkCardsForBrandStats = 'CARD.CHECK.FOR.BRAND.STATS',
  checkCardsForCrmStats = 'CARD.CHECK.FOR.CRM.STATS',
  checkCardsStatusInCrm = 'CARD.CHECK.STATUS.IN.CRM',
  //
  checkStatsDateAll = 'CARD.CHECK.STATS.DATE.ALL',

  athorizationTx = 'CARD.AUTHORIZATION.TX',
}

export default EventsNamesAccountEnum;
