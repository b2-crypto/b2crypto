enum EventsNamesUserEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'USER',
  download = 'USER.DOWNLOAD',
  //
  activeTwoFactor = 'activeTwoFactor',
  createMany = 'USER.CREATE.MANY',
  createOne = 'USER.CREATE.ONE',
  migrateOne = 'USER.MIGRATE.ONE',
  updateMany = 'USER.UPDATE.MANY',
  updateOne = 'USER.UPDATE.ONE',
  findAll = 'USER.FIND.ALL',
  findOneById = 'USER.FIND.ONE.BY.ID',
  findOneByEmail = 'USER.FIND.ONE.BY.EMAIL',
  findOneByApiKey = 'USER.FIND.ONE.BY.PUBLIC.KEY',
  deleteMany = 'USER.DELETE.MANY',
  deleteOneById = 'USER.DELETE.ONE.BY.ID',

  authorization = 'USER.AUTHORIZATION',
  refreshToken = 'USER.TOKEN.REFRESH',

  verifyEmail = 'USER.VERIFY.EMAIL',
  checkBalanceUser = 'USER.CHECK.BALANCE',
}

export default EventsNamesUserEnum;
