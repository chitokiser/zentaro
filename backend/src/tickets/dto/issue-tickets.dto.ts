import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class IssueTicketsDto {
  @IsInt()
  @Min(1)
  @Max(500)
  count: number;

  @IsOptional()
  @IsString()
  source?: string;
}
