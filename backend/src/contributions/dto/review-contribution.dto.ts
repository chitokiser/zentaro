import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ApproveContributionDto {
  @IsInt()
  @Min(1)
  apAmount: number;
}

export class RejectContributionDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
