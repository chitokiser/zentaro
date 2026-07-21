import { IsString, MinLength } from 'class-validator';

export class RedeemZtroRewardDto {
  @IsString()
  @MinLength(1)
  code: string;
}
