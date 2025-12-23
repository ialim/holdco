import { Transform } from "class-transformer";
import { IsDateString, IsIn, IsOptional, IsString, IsUUID } from "class-validator";

export class FinanceExportQueryDto {
  @IsOptional()
  @Transform(({ value }) => (typeof value === "string" ? value.toLowerCase() : value))
  @IsIn(["json", "csv"])
  format?: string;

  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsUUID()
  fiscal_period_id?: string;

  @IsOptional()
  @IsString()
  invoice_type?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
