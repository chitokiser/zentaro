import { IsNumber, Min, ValidateIf } from 'class-validator';

export class UpdateBarrelGrowthRateDto {
  @ValidateIf((o) => o.annualGrowthRate !== null)
  @IsNumber()
  @Min(0)
  annualGrowthRate: number | null;
}
