import { IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class RedeemPointsDto {
  @IsUUID()
  customer_id!: string;

  @Type(() => Number)
  @Min(1)
  points!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
