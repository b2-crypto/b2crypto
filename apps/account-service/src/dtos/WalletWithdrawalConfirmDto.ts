import { IsNotEmpty, IsString } from "class-validator";

export class WalletWithdrawalConfirmDto {
  @IsNotEmpty()
  @IsString()
  preorderId: string;
}