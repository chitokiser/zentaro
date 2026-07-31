import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateZtaroEligibilityDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  minStakeZtaro?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  minLevel?: number;
}
