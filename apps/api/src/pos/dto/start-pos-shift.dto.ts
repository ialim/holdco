import { Type } from "class-transformer";
import { IsOptional, IsString, IsUUID, Min } from "class-validator";

export class StartPosShiftDto {
  @IsString()
  device_id!: string;

  @IsOptional()
  @IsUUID()
  opened_by_id?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  opening_float?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
