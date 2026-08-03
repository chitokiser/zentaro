import { IsEthereumAddress, IsInt, IsISO8601, IsOptional, IsPositive, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateWatchDto {
  @IsEthereumAddress()
  address: string;

  @IsString()
  @MinLength(1)
  @MaxLength(200)
  label: string;

  /** ISO date string — when the tokens were granted to this wallet. */
  @IsISO8601()
  grantDate: string;

  @IsOptional()
  @IsInt()
  @IsPositive()
  grantAmount?: number;

  /** Cumulative balance decrease (proxy for "sold") that triggers an alert. */
  @IsInt()
  @IsPositive()
  sellThreshold: number;
}
