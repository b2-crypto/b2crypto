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
  setAffinityGroup = 'CARD.SET.AFFINITY.GROUP',
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
  getAffiliatesFromCards = 'CARD.FIND.AFFILIATES.JOBS',
  addCardFromAffiliate = 'CARD.CREATE.FROM.AFFILIATE.JOBS',

  // Stats & Checks
  checkCardsCreatedInPomelo = 'CARD.CHECK.CREATED.IN.POMELO.JOBS',
  checkCardsForAffiliateStats = 'CARD.CHECK.FOR.AFFILIATE.STATS.JOBS',
  checkCardsForBrandStats = 'CARD.CHECK.FOR.BRAND.STATS.JOBS',
  checkCardsForCrmStats = 'CARD.CHECK.FOR.CRM.STATS.JOBS',
  checkCardsStatusInCrm = 'CARD.CHECK.STATUS.IN.CRM.JOBS',
  checkStatsDateAll = 'CARD.CHECK.STATS.DATE.ALL.JOBS',
  count = 'ACCOUNT.COUNT.JOBS',

  // Transactions & Reports
  athorizationTx = 'CARD.AUTHORIZATION.TX.JOBS',
  pomeloTransaction = 'CARD.POMELO.TRANSACTION.JOBS',
  sendBalanceReport = 'ACCOUNT.SEND.BALANCE.REPORT.JOBS',
  levelUpCards = 'CARD.LEVEL.UP.JOBS',
}

export default EventsNamesAccountEnum;
