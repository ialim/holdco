import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, IsUUID, Matches, Min } from "class-validator";
import { Type } from "class-transformer";

const PAYMENT_METHODS = ["card", "transfer", "ussd"] as const;

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

  @IsOptional()
  @IsIn(PAYMENT_METHODS)
  payment_method?: (typeof PAYMENT_METHODS)[number];

  @IsOptional()
  @IsEmail()
  customer_email?: string;
}
