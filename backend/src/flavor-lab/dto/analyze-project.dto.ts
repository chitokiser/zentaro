import { IsIn, IsOptional } from 'class-validator';

export class AnalyzeProjectDto {
  @IsOptional()
  @IsIn(['ko', 'en', 'vi'])
  locale?: 'ko' | 'en' | 'vi';
}
