import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListAuditLogsDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsUUID()
  actor_id?: string;

  @IsOptional()
  @IsUUID()
  entity_id?: string;

  @IsOptional()
  @IsString()
  entity_type?: string;

  @IsOptional()
  @IsString()
  action?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
