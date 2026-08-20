import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { BotanicalScoresDto } from './botanical-scores.dto';

export const EXTRACTION_METHODS = [
  'Vapor Infusion',
  'Maceration & Boiling',
  'Cold Maceration',
  'Vacuum Distillation',
  'Low-Temp Vacuum Extraction',
  'Co-Distillation',
  'Post-Distillation Blending',
] as const;

export class UpsertBotanicalDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  localName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  origin?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  plantPart?: string;

  @IsArray()
  @IsString({ each: true })
  topAroma: string[];

  @IsArray()
  @IsString({ each: true })
  midAroma: string[];

  @IsArray()
  @IsString({ each: true })
  baseAroma: string[];

  @ValidateNested()
  @Type(() => BotanicalScoresDto)
  scores: BotanicalScoresDto;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  colorEffect?: string;

  @IsNumber() @Min(0) @Max(100)
  aromaIntensity: number;

  @IsNumber() @Min(0) @Max(100)
  flavorIntensity: number;

  @IsNumber() @Min(0)
  recommendedDoseMin: number;

  @IsNumber() @Min(0)
  recommendedDoseMax: number;

  @IsOptional()
  @IsNumber() @Min(0) @Max(100)
  recommendedAbv?: number;

  @IsIn(EXTRACTION_METHODS)
  extractionMethod: (typeof EXTRACTION_METHODS)[number];

  @IsNumber() @Min(0)
  extractionTimeHours: number;

  @IsNumber()
  extractionTemperatureC: number;

  @IsString()
  @MaxLength(200)
  distillationBehavior: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}
