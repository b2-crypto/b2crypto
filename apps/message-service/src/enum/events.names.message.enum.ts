enum EventsNamesMessageEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'MESSAGE',
  download = 'MESSAGE.DOWNLOAD',
  //
  createMany = 'MESSAGE.CREATE.MANY',
  createOne = 'MESSAGE.CREATE.ONE',
  updateMany = 'MESSAGE.UPDATE.MANY',
  updateOne = 'MESSAGE.UPDATE.ONE',
  findAll = 'MESSAGE.FIND.ALL',
  findOneById = 'MESSAGE.FIND.ONE.BY.ID',
  deleteMany = 'MESSAGE.DELETE.MANY',
  deleteOneById = 'MESSAGE.DELETE.ONE.BY.ID',

  sendEmailBalanceReport = 'MESSAGE.SEND.EMAIL.REPORT',
  sendEmailOtpNotification = 'MESSAGE.SEND.EMAIL.OTP.NOTIFICATION',
  sendEmailDisclaimer = 'MESSAGE.SEND.EMAIL.DISCLAIMER',
  sendCardRequestConfirmationEmail = 'MESSAGE.SEND.CARD.REQUEST.CONFIRMATION.EMAIL',
  sendProfileRegistrationCreation = 'MESSAGE.SEND.PROFILE.REGISTRATION.CREATION',
  sendVirtualPhysicalCards = 'MESSAGE.SEND.VIRTUAL.PHYSICAL.CARDS',
  sendAdjustments = 'MESSAGE.SEND.PURCHASES.TRANSACTION.ADJUSTMENTS',
  sendPurchases = 'MESSAGE.SEND.PURCHASES.TRANSACTION.PURCHASES',
  sendCryptoWalletsManagement = 'MESSAGE.SEND.CRYPTO.WALLETS.MANAGEMENT',
  sendSecurityNotifications = 'MESSAGE.SEND.SECURITY.NOTIFICATIONS',
  sendPasswordRestoredEmail = 'MESSAGE.SEND.PASSWORD.RESTORED.EMAIL',
}

export default EventsNamesMessageEnum;
