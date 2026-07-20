import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class ApproveBottleCapClaimDto {
  @IsInt()
  @Min(0)
  apAmount: number;
}

export class RejectBottleCapClaimDto {
  @IsOptional()
  @IsString()
  reason?: string;
}
