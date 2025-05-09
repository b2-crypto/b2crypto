enum EventsNamesAccountEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'CARD',
  download = 'ACCOUNT.DOWNLOAD',

  // Card Operations
  createMany = 'CARD.CREATE.MANY.JOBS',
  createOne = 'CARD.CREATE.ONE.JOBS',
  createOneCard = 'ACCOUNT.CREATE.ONE.CARD.JOBS',
  updateMany = 'CARD.UPDATE.MANY.JOBS',
  updateOne = 'CARD.UPDATE.ONE.JOBS',
  updateAmount = 'CARD.UPDATE.AMOUNT.JOBS',
  updateMigratedOwner = 'CARD.MIGRATE.OWNER.JOBS',
  updateOneByTpId = 'CARD.UPDATE.ONE.BY.TP.ID.JOBS',
  updateOneCard = 'ACCOUNT.UPDATE.ONE.CARD.JOBS',
  customUpdateOne = 'ACCOUNT.CUSTOM.UPDATE.ONE.JOBS',
  setAffinityGroup = 'CARD.SET.AFFINITY.GROUP.JOBS',
  setBalanceByCard = 'SET.BALANCE.BY.CARD.JOBS',
  deleteMany = 'CARD.DELETE.MANY.JOBS',
  deleteOneById = 'CARD.DELETE.ONE.BY.ID.JOBS',

  // Card Queries
  findAll = 'FILE.CARD.ALL.JOBS',
  findOneById = 'CARD.FIND.ONE.BY.ID.JOBS',
  findOneByCardId = 'CARD.FIND.ONE.BY.CARD.ID.JOBS',
  findOneByTpId = 'CARD.FIND.ONE.BY.TP.ID.JOBS',

  // Migration
  mingrateOne = 'CARD.MIGRATE.ONE.JOBS',
  findAllCardsToMigrate = 'FIND.CARD.ALL.JOBS',

  // Wallet
  createOneWallet = 'ACCOUNT.CREATE.ONE.WALLET.JOBS',
  migrateOneWallet = 'WALLET.MIGRATE.ONE.JOBS',
  sweepOmnibus = 'WALLET.SWEEP.OMNIBUS.JOBS',

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
