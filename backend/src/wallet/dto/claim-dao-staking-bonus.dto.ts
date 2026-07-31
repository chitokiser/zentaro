import { IsInt, Min } from 'class-validator';

export class ClaimDaoStakingBonusDto {
  @IsInt()
  @Min(0)
  stakeId: number;
}
