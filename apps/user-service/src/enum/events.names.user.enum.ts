enum EventsNamesUserEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'USER',
  download = 'USER.DOWNLOAD',
  //
  activeTwoFactor = 'activeTwoFactor',
  createMany = 'USER.CREATE.MANY',
  createOne = 'USER.CREATE.ONE',
  updateMany = 'USER.UPDATE.MANY',
  updateOne = 'USER.UPDATE.ONE',
  findAll = 'USER.FIND.ALL',
  findOneById = 'USER.FIND.ONE.BY.ID',
  findOneByApiKey = 'USER.FIND.ONE.BY.PUBLIC.KEY',
  deleteMany = 'USER.DELETE.MANY',
  deleteOneById = 'USER.DELETE.ONE.BY.ID',

  authorization = 'USER.AUTHORIZATION',
  refreshToken = 'USER.TOKEN.REFRESH',

  verifyEmail = 'USER.VERIFY.EMAIL',
}

export default EventsNamesUserEnum;
