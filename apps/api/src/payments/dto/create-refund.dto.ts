import { IsOptional, IsString, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateRefundDto {
  @IsUUID()
  payment_id!: string;

  @Type(() => Number)
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}
