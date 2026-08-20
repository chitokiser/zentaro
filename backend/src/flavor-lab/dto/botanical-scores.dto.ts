import { IsNumber, Max, Min } from 'class-validator';

export class BotanicalScoresDto {
  @IsNumber() @Min(0) @Max(100) floral: number;
  @IsNumber() @Min(0) @Max(100) fruity: number;
  @IsNumber() @Min(0) @Max(100) citrus: number;
  @IsNumber() @Min(0) @Max(100) herbal: number;
  @IsNumber() @Min(0) @Max(100) spicy: number;
  @IsNumber() @Min(0) @Max(100) woody: number;
  @IsNumber() @Min(0) @Max(100) earthy: number;
  @IsNumber() @Min(0) @Max(100) vanilla: number;
  @IsNumber() @Min(0) @Max(100) roasted: number;

  @IsNumber() @Min(0) @Max(100) sweet: number;
  @IsNumber() @Min(0) @Max(100) sour: number;
  @IsNumber() @Min(0) @Max(100) bitter: number;
  @IsNumber() @Min(0) @Max(100) umami: number;
  @IsNumber() @Min(0) @Max(100) salty: number;
  @IsNumber() @Min(0) @Max(100) astringency: number;

  @IsNumber() @Min(0) @Max(100) body: number;
  @IsNumber() @Min(0) @Max(100) dryness: number;
  @IsNumber() @Min(0) @Max(100) finish: number;
}

export const AROMA_AXES = [
  'floral', 'fruity', 'citrus', 'herbal', 'spicy', 'woody', 'earthy', 'vanilla', 'roasted',
] as const;
export const TASTE_AXES = ['sweet', 'sour', 'bitter', 'umami', 'salty', 'astringency'] as const;

export type AromaAxis = (typeof AROMA_AXES)[number];
export type TasteAxis = (typeof TASTE_AXES)[number];
