import { IsBoolean } from 'class-validator';

export class SetZentaroFlagDto {
  @IsBoolean()
  isZentaroProduct!: boolean;
}
