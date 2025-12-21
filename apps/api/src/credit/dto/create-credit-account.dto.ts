import { IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateCreditAccountDto {
  @IsUUID()
  reseller_id!: string;

  @Type(() => Number)
  @Min(0)
  limit_amount!: number;
}
