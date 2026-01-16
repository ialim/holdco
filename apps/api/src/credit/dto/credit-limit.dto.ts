import { IsString, IsUUID, Min, MinLength } from "class-validator";
import { Type } from "class-transformer";

export class CreditLimitDto {
  @IsUUID()
  reseller_id!: string;

  @Type(() => Number)
  @Min(0)
  limit_amount!: number;

  @IsString()
  @MinLength(3)
  reason!: string;
}
