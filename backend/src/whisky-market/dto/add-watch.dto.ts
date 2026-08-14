import { IsString, MinLength } from 'class-validator';

export class AddWatchDto {
  @IsString()
  @MinLength(1)
  distillerySlug!: string;
}
