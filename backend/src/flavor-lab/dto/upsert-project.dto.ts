import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ProjectBotanicalDoseDto {
  @IsString()
  botanicalId: string;

  @IsNumber() @Min(0)
  doseGrams: number;
}

export class UpsertProjectDto {
  @IsString()
  @MaxLength(100)
  projectName: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  accentColor?: string;

  @IsString()
  @MaxLength(100)
  baseSpirit: string;

  @IsNumber() @Min(0)
  baseAbv: number;

  @IsNumber() @Min(0)
  targetAbv: number;

  @IsNumber() @Min(1)
  baseVolumeMl: number;

  @IsString()
  @MaxLength(200)
  extractionMethod: string;

  @IsNumber() @Min(0)
  extractionTimeHours: number;

  @IsNumber()
  extractionTemperatureC: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ProjectBotanicalDoseDto)
  botanicals: ProjectBotanicalDoseDto[];

  @IsOptional()
  @IsString()
  @MaxLength(20)
  version?: string;
}
