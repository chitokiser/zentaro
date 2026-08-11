import { IsInt, Min } from 'class-validator';

export class UpdateRankingConfigDto {
  @IsInt()
  @Min(0)
  minReviews!: number;
}
