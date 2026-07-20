import { IsIn } from 'class-validator';

export class SetAdminLevelDto {
  @IsIn([1, 2, 3, null])
  adminLevel: 1 | 2 | 3 | null;
}
