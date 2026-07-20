import { IsBoolean, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export class SubmitBottleCapClaimDto {
  @IsBoolean()
  isZentaro: boolean;

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
