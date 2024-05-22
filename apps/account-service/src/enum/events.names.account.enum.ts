enum EventsNamesAccountEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'CARD',
  download = 'CARD.DOWNLOAD',
  downloadDatabase = 'CARD.DOWNLOAD.DATABASE',
  downloadData = 'CARD.DOWNLOAD.DATA',
  downloadCftd = 'CARD.DOWNLOAD.CFTD',
  downloadFtd = 'CARD.DOWNLOAD.FTD',
  downloadRetention = 'CARD.DOWNLOAD.RETENTION',
  //
  createMany = 'CARD.CREATE.MANY',
  createOne = 'CARD.CREATE.ONE',
  updateMany = 'CARD.UPDATE.MANY',
  updateOne = 'CARD.UPDATE.ONE',
  updateOneByTpId = 'CARD.UPDATE.ONE.BY.TP.ID',
  findAll = 'FILE.CARD.ALL',
  findOneById = 'CARD.FIND.ONE.BY.ID',
  deleteMany = 'CARD.DELETE.MANY',
  deleteOneById = 'CARD.DELETE.ONE.BY.ID',

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
}

export default EventsNamesAccountEnum;
