import { IsIn, IsInt, IsOptional, IsString, Min, MinLength } from 'class-validator';

export const CONTRIBUTION_ITEM_TYPES = [
  'oak_barrel',
  'brandy',
  'whisky',
  'gin',
  'rum',
  'other',
] as const;

export class SubmitContributionDto {
  @IsIn(CONTRIBUTION_ITEM_TYPES)
  itemType: (typeof CONTRIBUTION_ITEM_TYPES)[number];

  @IsInt()
  @Min(1)
  quantity: number;

  @IsString()
  @MinLength(5)
  description: string;

  @IsString()
  @MinLength(5)
  contactPhone: string;

  @IsOptional()
  @IsString()
  address?: string;
}
