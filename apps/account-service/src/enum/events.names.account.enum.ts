enum EventsNamesAccountEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'CARD',
  download = 'ACCOUNT.DOWNLOAD',

  // Card Operations
  createMany = 'CARD.CREATE.MANY',
  createOne = 'CARD.CREATE.ONE',
  createOneCard = 'ACCOUNT.CREATE.ONE.CARD',
  updateMany = 'CARD.UPDATE.MANY',
  updateOne = 'CARD.UPDATE.ONE',
  updateAmount = 'CARD.UPDATE.AMOUNT',
  updateMigratedOwner = 'CARD.MIGRATE.OWNER',
  updateOneByTpId = 'CARD.UPDATE.ONE.BY.TP.ID',
  updateOneCard = 'ACCOUNT.UPDATE.ONE.CARD',
  customUpdateOne = 'ACCOUNT.CUSTOM.UPDATE.ONE',
  setBalanceByCard = 'SET.BALANCE.BY.CARD',
  deleteMany = 'CARD.DELETE.MANY',
  deleteOneById = 'CARD.DELETE.ONE.BY.ID',

  // Card Queries
  findAll = 'FILE.CARD.ALL',
  findOneById = 'CARD.FIND.ONE.BY.ID',
  findOneByCardId = 'CARD.FIND.ONE.BY.CARD.ID',
  findOneByTpId = 'CARD.FIND.ONE.BY.TP.ID',
  
  // Migration
  mingrateOne = 'CARD.MIGRATE.ONE',
  findAllCardsToMigrate = 'FIND.CARD.ALL',

  // Wallet
  createOneWallet = 'ACCOUNT.CREATE.ONE.WALLET',
  migrateOneWallet = 'WALLET.MIGRATE.ONE',
  sweepOmnibus = 'WALLET.SWEEP.OMNIBUS',

  // Affiliate Related
  getAffiliatesFromCards = 'CARD.FIND.AFFILIATES',
  addCardFromAffiliate = 'CARD.CREATE.FROM.AFFILIATE',
  
  // Stats & Checks
  checkCardsCreatedInPomelo = 'CARD.CHECK.CREATED.IN.POMELO',
  checkCardsForAffiliateStats = 'CARD.CHECK.FOR.AFFILIATE.STATS',
  checkCardsForBrandStats = 'CARD.CHECK.FOR.BRAND.STATS',
  checkCardsForCrmStats = 'CARD.CHECK.FOR.CRM.STATS',
  checkCardsStatusInCrm = 'CARD.CHECK.STATUS.IN.CRM',
  checkStatsDateAll = 'CARD.CHECK.STATS.DATE.ALL',
  count = 'ACCOUNT.COUNT',

  // Transactions & Reports
  athorizationTx = 'CARD.AUTHORIZATION.TX',
  pomeloTransaction = 'CARD.POMELO.TRANSACTION',
  sendBalanceReport = 'ACCOUNT.SEND.BALANCE.REPORT',
  levelUpCards = 'CARD.LEVEL.UP'
}

export default EventsNamesAccountEnum;