import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MinLength,
} from 'class-validator';

export class SetTargetDto {
  @IsString()
  @MinLength(1)
  distillerySlug!: string;

  @IsNumber()
  @Min(0)
  targetPrice!: number;

  @IsOptional()
  @IsBoolean()
  notificationOn?: boolean;
}
