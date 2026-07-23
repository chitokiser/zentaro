import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class SetBarrelEvaluationDto {
  @IsInt()
  @Min(0)
  @Max(500)
  score: number;

  @IsOptional()
  @IsString()
  comment?: string;
}
