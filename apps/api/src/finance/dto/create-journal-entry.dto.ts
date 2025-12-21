import { Type } from "class-transformer";
import { ArrayNotEmpty, IsArray, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";

class JournalLineDto {
  @IsUUID()
  account_id!: string;

  @IsOptional()
  @IsUUID()
  cost_center_id?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  debit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  credit?: number;
}

export class CreateJournalEntryDto {
  @IsUUID()
  fiscal_period_id!: string;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsString()
  memo?: string;

  @IsArray()
  @ArrayNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => JournalLineDto)
  lines!: JournalLineDto[];
}
