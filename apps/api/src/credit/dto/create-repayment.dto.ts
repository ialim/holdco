import { IsDateString, IsOptional, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateRepaymentDto {
  @IsUUID()
  credit_account_id!: string;

  @Type(() => Number)
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsDateString()
  paid_at?: string;
}
