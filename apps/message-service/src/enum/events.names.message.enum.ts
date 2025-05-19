enum EventsNamesMessageEnum {
  // Websocket
  websocketPort = '3100',
  clientName = 'MESSAGE',
  download = 'MESSAGE.DOWNLOAD',

  // CRUD Operations
  createMany = 'MESSAGE.CREATE.MANY',
  createOne = 'MESSAGE.CREATE.ONE',
  updateMany = 'MESSAGE.UPDATE.MANY',
  updateOne = 'MESSAGE.UPDATE.ONE',
  findAll = 'MESSAGE.FIND.ALL',
  findOneById = 'MESSAGE.FIND.ONE.BY.ID',
  deleteMany = 'MESSAGE.DELETE.MANY',
  deleteOneById = 'MESSAGE.DELETE.ONE.BY.ID',

  // Email Notifications
  sendEmailBalanceReport = 'MESSAGE.SEND.EMAIL.REPORT',
  sendEmailOtpNotification = 'MESSAGE.SEND.EMAIL.OTP.NOTIFICATION',
  sendEmailDisclaimer = 'MESSAGE.SEND.EMAIL.DISCLAIMER',
  sendCardRequestConfirmationEmail = 'MESSAGE.SEND.CARD.REQUEST.CONFIRMATION.EMAIL',
  sendProfileRegistrationCreation = 'MESSAGE.SEND.PROFILE.REGISTRATION.CREATION',
  sendActivatePhysicalCards = 'MESSAGE.SEND.ACTIVE.PHYSICAL.CARDS',
  sendDepositWalletReceived = 'MESSAGE.SEND.DEPOSIT.WALLET.RECEIVED',
  sendRechargeCardReceived = 'MESSAGE.SEND.RECHARGE.CARD.RECEIVED',
  sendAdjustments = 'MESSAGE.SEND.PURCHASES.TRANSACTION.ADJUSTMENTS',
  sendPurchases = 'MESSAGE.SEND.PURCHASES.TRANSACTION.PURCHASES',
  sendCryptoWalletsManagement = 'MESSAGE.SEND.CRYPTO.WALLETS.MANAGEMENT',
  sendSecurityNotifications = 'MESSAGE.SEND.SECURITY.NOTIFICATIONS',
  sendPreRegisterEmail = 'sendPreRegisterEmail',
  sendPasswordRestoredEmail = 'MESSAGE.SEND.PASSWORD.RESTORED.EMAIL',
  sendPurchaseRejected = 'MESSAGE.SEND.PURCHASE.REJECTED.EMAIL',
}

export default EventsNamesMessageEnum;
