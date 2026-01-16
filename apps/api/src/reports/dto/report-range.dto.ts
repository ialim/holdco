import { IsDateString, IsOptional, IsUUID } from "class-validator";

export class ReportRangeDto {
  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsUUID()
  reseller_id?: string;
}
