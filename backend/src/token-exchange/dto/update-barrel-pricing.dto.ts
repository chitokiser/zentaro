import { IsNumber, IsOptional, Min } from 'class-validator';

export class UpdateBarrelPricingDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  baseUsdPerLiter?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  usdToZpRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  annualGrowthRate?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerLiterExp?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  pricePerLiterZp?: number;
}
