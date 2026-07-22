import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class SubmitBottleCapClaimDto {
  @IsBoolean()
  isZentaro: boolean;

  /** Which ZENTARO product line the cap is from — determines the EXP payout rate. Ignored when isZentaro is false. */
  @IsOptional()
  @IsIn(['origin', 'blue'])
  zentaroProduct?: 'origin' | 'blue';

  @IsString()
  @MinLength(1)
  brand: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsBoolean()
  sealConfirmed: boolean;

  @IsString()
  @MinLength(5)
  contactPhone: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  note?: string;
}
