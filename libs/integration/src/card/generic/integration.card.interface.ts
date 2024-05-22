import { CardDto } from './dto/card.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { UserResponseDto } from '@integration/integration/crm/generic/dto/user.response.dto';
import { AxiosInstance, AxiosResponse } from 'axios';
import { UserCardDto } from './dto/user.card.dto';

export interface IntegrationCardInterface<
  TUserCardDto = UserCardDto,
  TCardDto = UserCardDto,
  TUserResponse = UserResponseDto,
> {
  http: AxiosInstance;

  generateHttp();

  getUser(userCard: TUserCardDto): Promise<AxiosResponse<any[]>>;
  createUser(userCard: TUserCardDto): Promise<AxiosResponse<any[]>>;
  updateUser(userCard: TUserCardDto): Promise<AxiosResponse<any[]>>;

  getCard(card: TCardDto): Promise<AxiosResponse<any[]>>;
  createCards(card: TCardDto): Promise<AxiosResponse<any[]>>;
  updateCard(card: TCardDto): Promise<AxiosResponse<any[]>>;

  getInformationCard(
    userCardDto: TUserCardDto,
    cardDto: TCardDto,
  ): Promise<AxiosResponse<any[]>>;
  sendPhysicalCard(
    userCard: TUserCardDto,
    cardDto: TCardDto,
  ): Promise<AxiosResponse<any[]>>;
}
