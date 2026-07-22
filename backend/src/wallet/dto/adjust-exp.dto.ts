import { IsInt, IsOptional, IsString, NotEquals } from 'class-validator';

export class AdjustExpDto {
  @IsInt()
  @NotEquals(0)
  amount: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
