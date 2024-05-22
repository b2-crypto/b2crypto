// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { TrackVisitDto } from '@integration/integration/crm/generic/dto/track-visit.dto';
import { UserResponseDto } from '@integration/integration/crm/generic/dto/user.response.dto';
import { AxiosInstance, AxiosResponse } from 'axios';
import { Observable } from 'rxjs';

export interface IntegrationCryptoInterface<
  TTrackVisitDto = TrackVisitDto,
  TUserResponse = UserResponseDto,
> {
  http: AxiosInstance;

  generateHttp();

  affiliateTrackVisit(
    trackVisitDto: TTrackVisitDto,
  ): Observable<AxiosResponse<any[]>>;
}
