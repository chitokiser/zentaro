import { IsEmail, IsIn } from 'class-validator';

export class PromoteAdminDto {
  @IsEmail()
  email: string;

  @IsIn([1, 2, 3])
  adminLevel: 1 | 2 | 3;
}
