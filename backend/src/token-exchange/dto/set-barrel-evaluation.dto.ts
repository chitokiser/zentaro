import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SetBarrelEvaluationDto {
  @IsInt()
  @Min(0)
  @Max(500)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;

  // Optional category breakdown — when all four are provided, they take over as the
  // source of truth for the total score (score = sum of the four) and feed the AI comment prompt.
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(200)
  aroma?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(180)
  palate?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(70)
  finish?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(50)
  barrelQuality?: number;
}
