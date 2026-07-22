import { IsEnum, IsNumber, IsString, Min } from 'class-validator';

export class CreateDepositRequestDto {
    @IsNumber()
    @Min(10000)
    zpAmount: number;

    @IsString()
    depositorName: string;

    @IsEnum(['VND', 'KRW'])
    currency: 'VND' | 'KRW';
}
