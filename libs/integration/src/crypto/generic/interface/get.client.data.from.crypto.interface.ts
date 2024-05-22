import { UserResponseDto } from '../dto/user.response.dto';

export interface GetLeadDataFromCryptoInterface {
  getClientDataFromCrypto(client: any): UserResponseDto;
}
