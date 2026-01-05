import { Type } from "class-transformer";
import { IsOptional, IsString, IsUUID, Min } from "class-validator";

export class ClosePosShiftDto {
  @IsOptional()
  @IsUUID()
  closed_by_id?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  closing_float?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
