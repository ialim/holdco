import { IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreatePaymentIntentDto {
  @IsUUID()
  order_id!: string;

  @Type(() => Number)
  @Min(0)
  amount!: number;

  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency!: string;

  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsString()
  capture_method?: string;
}
