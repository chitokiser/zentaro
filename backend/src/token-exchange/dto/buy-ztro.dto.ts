import { IsInt, IsNumber, IsOptional, IsPositive, Min } from 'class-validator';

export class BuyZtroDto {
  @IsInt()
  @Min(1)
  amount: number;

  // Human-readable USDT (e.g. 12.5). Slippage guard passed through to the contract's
  // maxPay; omit to skip slippage protection.
  @IsOptional()
  @IsNumber()
  @IsPositive()
  maxPayUsdt?: number;
}
