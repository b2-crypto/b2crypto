enum EventsNamesUserEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'USER',
  download = 'USER.DOWNLOAD',
  //
  activeTwoFactor = 'activeTwoFactor.JOBS',
  createMany = 'USER.CREATE.MANY.JOBS',
  createOne = 'USER.CREATE.ONE.JOBS',
  migrateOne = 'USER.MIGRATE.ONE.JOBS',
  updateMany = 'USER.UPDATE.MANY.JOBS',
  updateOne = 'USER.UPDATE.ONE.JOBS',
  findAll = 'USER.FIND.ALL.JOBS',
  findOneById = 'USER.FIND.ONE.BY.ID.JOBS',
  findOneByEmail = 'USER.FIND.ONE.BY.EMAIL.JOBS',
  findOneByApiKey = 'USER.FIND.ONE.BY.PUBLIC.KEY.JOBS',
  deleteMany = 'USER.DELETE.MANY.JOBS',
  deleteOneById = 'USER.DELETE.ONE.BY.ID.JOBS',

  authorization = 'USER.AUTHORIZATION.JOBS',
  refreshToken = 'USER.TOKEN.REFRESH.JOBS',

  verifyEmail = 'USER.VERIFY.EMAIL.JOBS',
  checkBalanceUser = 'USER.CHECK.BALANCE.JOBS',
  updateLeveluser = 'USER.UPDATE.LEVEL.JOBS',
}

export default EventsNamesUserEnum;
