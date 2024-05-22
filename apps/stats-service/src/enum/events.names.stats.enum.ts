enum EventsNamesStatsEnum {
  // Websocket
  websocketPortStatsPspAccount = '3100',
  clientNameStatsPspAccount = 'STATS',
  downloadPspAccount = 'STATS.PSP.ACCOUNT.DOWNLOAD',
  websocketPortStatsAffiliate = '3100',
  clientNameStatsAffiliate = 'STATS',
  downloadAffiliate = 'STATS.AFFILIATE.DOWNLOAD',
  //
  checkStatsPsp = 'STATS.PSP.CHECK',
  checkStatsPspAccount = 'STATS.PSP_ACCOUNT.CHECK',
  findAllStatsPspAccount = 'STATS.PSP_ACCOUNT.FIND.ALL',
  checkStatsAffiliate = 'STATS.AFFILIATE.CHECK',
  checkStatsTransfer = 'STATS.TRANSFER.CHECK',
  checkAllStatsAffiliate = 'STATS.AFFILIATE.CHECK.ALL',
  removeAllStatsAffiliate = 'STATS.AFFILIATE.REMOVE.ALL',
  checkAllStatsPspAccount = 'STATS.PSP_ACCOUNT.CHECK.ALL',
  removeAllStatsPspAccount = 'STATS.PSP_ACCOUNT.REMOVE.ALL',
  createStat = 'STATS.CREATE',
}

export default EventsNamesStatsEnum;
