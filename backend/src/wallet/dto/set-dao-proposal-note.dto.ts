import { IsInt, IsString, Min, MaxLength } from 'class-validator';

export class SetDaoProposalNoteDto {
  @IsInt()
  @Min(0)
  proposalId: number;

  @IsString()
  @MaxLength(100)
  purpose: string;
}
