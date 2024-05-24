export interface CardRoutesInterface {
  // configSearch
  getFormatKey?: string;
  // Auth
  auth?: string;
  // User
  createUser?: string;
  updateUser?: string;
  searchUser?: string;
  // Card
  createCard?: string;
  updateCard?: string;
  activateCard?: string;
  searchCard?: string;
  searchAffinityGroupCard?: string;
  associateCard?: string;
  disassociateCard?: string;
  searchAssociationCard?: string;
  // Sensible Information
  getTokenInformationCard?: string;
  getInformationCard?: string;
  // Shipping
  createShippingCard?: string;
  searchShippingCard?: string;
  updateShippingCard?: string;
  historyShippingCard?: string;
  receiverShippingCard?: string;
  // Provisioning
  visaApplePayCard?: string;
  mastercardApplePayCard?: string;
  visaGooglePayCard?: string;
  mastercardGooglePayCard?: string;
}
