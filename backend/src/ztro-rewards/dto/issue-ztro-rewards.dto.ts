import { IsInt, Max, Min } from 'class-validator';

export class IssueZtroRewardsDto {
  @IsInt()
  @Min(1)
  @Max(500)
  count: number;

  // Multiplier applied on-chain: payout = baseValue x randomMultiplier (1-10,000).
  @IsInt()
  @Min(1)
  baseValue: number;
}
