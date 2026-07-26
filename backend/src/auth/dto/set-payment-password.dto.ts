import { IsString, Matches } from 'class-validator';

export class SetPaymentPasswordDto {
    @IsString()
    @Matches(/^\d{6}$/, { message: '자금이체 비밀번호는 숫자 6자리여야 합니다.' })
    pin: string;
}
