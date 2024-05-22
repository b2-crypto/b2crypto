enum EventsNamesBrandEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'BRAND',
  download = 'BRAND.DOWNLOAD',
  //
  createOne = 'BRAND.CREATE.ONE',
  createMany = 'BRAND.CREATE.MANY',
  updateOne = 'BRAND.UPDATE.ONE.BY.ID',
  updateMany = 'BRAND.UPDATE.MANY',
  findAll = 'BRAND.FIND.MANY',
  findOneById = 'BRAND.FIND.ONE.BY.ID',
  deleteOneById = 'BRAND.DELETE.ONE',
  deleteMany = 'BRAND.DELETE.MANY',
  checkCashierBrands = 'BRAND.CHECK.CASHIER.BRANDS',
  findOneByName = 'BRAND.FIND.ONE.BY.NAME',
  checkBrandStats = 'BRAND.CHECK.STATS',
}

export default EventsNamesBrandEnum;
