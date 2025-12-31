import { IsOptional, IsUUID } from "class-validator";

export class SetupStandardAccountsDto {
  @IsUUID()
  groupId!: string;

  @IsOptional()
  @IsUUID()
  subsidiaryId?: string; // if provided, seed only one company
}
