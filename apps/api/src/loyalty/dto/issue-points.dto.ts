import { IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class IssuePointsDto {
  @IsUUID()
  customer_id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  points!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
