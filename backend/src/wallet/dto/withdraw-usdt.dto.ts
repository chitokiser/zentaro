import { IsInt, Min } from 'class-validator';

export class WithdrawUsdtDto {
  @IsInt()
  @Min(10000)
  zpAmount: number;
}
