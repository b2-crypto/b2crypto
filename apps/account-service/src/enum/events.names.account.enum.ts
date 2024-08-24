enum EventsNamesAccountEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'CARD',
  download = 'ACCOUNT.DOWNLOAD',
  //
  createMany = 'CARD.CREATE.MANY',
  createOne = 'CARD.CREATE.ONE',
  updateMany = 'CARD.UPDATE.MANY',
  updateOne = 'CARD.UPDATE.ONE',
  updateAmount = 'CARD.UPDATE.AMOUNT',
  updateMigratedOwner = 'CARD.MIGRATE.OWNER',
  updateOneByTpId = 'CARD.UPDATE.ONE.BY.TP.ID',
  setBalanceByCard = 'SET.BALANCE.BY.CARD',
  mingrateOne = 'CARD.MIGRATE.ONE',
  findAll = 'FILE.CARD.ALL',
  findAllCardsToMigrate = 'FIND.CARD.ALL',
  findOneById = 'CARD.FIND.ONE.BY.ID',
  findOneByCardId = 'CARD.FIND.ONE.BY.CARD.ID',
  deleteMany = 'CARD.DELETE.MANY',
  deleteOneById = 'CARD.DELETE.ONE.BY.ID',

  //Wallet
  migrateOneWallet = 'WALLET.MIGRATE.ONE',

  findOneByTpId = 'CARD.FIND.ONE.BY.TP.ID',
  getAffiliatesFromCards = 'CARD.FIND.AFFILIATES',
  addCardFromAffiliate = 'CARD.CREATE.FROM.AFFILIATE',
  checkCardsCreatedInCrm = 'CARD.CHECK.CREATED.IN.CRM',
  checkCardsForAffiliateStats = 'CARD.CHECK.FOR.AFFILIATE.STATS',
  checkCardsForBrandStats = 'CARD.CHECK.FOR.BRAND.STATS',
  checkCardsForCrmStats = 'CARD.CHECK.FOR.CRM.STATS',
  checkCardsStatusInCrm = 'CARD.CHECK.STATUS.IN.CRM',
  //
  checkStatsDateAll = 'CARD.CHECK.STATS.DATE.ALL',

  athorizationTx = 'CARD.AUTHORIZATION.TX',
  count = 'ACCOUNT.COUNT',
  createOneWallet = 'ACCOUNT.CREATE.ONE.WALLET',
  customUpdateOne = 'ACCOUNT.CUSTOM.UPDATE.ONE',

  pomeloTransaction = 'CARD.POMELO.TRANSACTION',
}

export default EventsNamesAccountEnum;
