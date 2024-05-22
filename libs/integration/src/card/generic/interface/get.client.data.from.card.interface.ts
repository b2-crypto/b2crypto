import { UserResponseDto } from '../dto/user.response.dto';

export interface GetLeadDataFromCRMInterface {
  getClientDataFromCard(client: any): UserResponseDto;
}
