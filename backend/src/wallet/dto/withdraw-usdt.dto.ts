import { IsInt, IsString, Matches, Min } from 'class-validator';

export class WithdrawUsdtDto {
  @IsInt()
  @Min(10000)
  zpAmount: number;

  @IsString()
  @Matches(/^\d{6}$/, { message: '자금이체 비밀번호는 숫자 6자리여야 합니다.' })
  paymentPassword: string;
}
