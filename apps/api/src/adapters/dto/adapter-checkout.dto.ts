import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches, Min, ValidateNested } from "class-validator";
import { CreateOrderDto } from "../../orders/dto/create-order.dto";

const PAYMENT_METHODS = ["card", "transfer", "ussd"] as const;
const TENDER_METHODS = ["card", "transfer", "ussd", "cash", "points"] as const;
const PAYMENT_PLANS = ["full", "split", "deposit", "installment", "points"] as const;

class AdapterPaymentDto {
  @IsOptional()
  @IsIn(TENDER_METHODS)
  method?: (typeof TENDER_METHODS)[number];

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  amount?: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

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

  @IsOptional()
  @IsString()
  terminal_serial?: string;

  @IsOptional()
  @IsString()
  transaction_type?: string;

  @IsOptional()
  @IsIn(PAYMENT_PLANS)
  payment_type?: (typeof PAYMENT_PLANS)[number];

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  points?: number;
}

class AdapterLoyaltyDto {
  @IsUUID()
  customer_id!: string;

  @Type(() => Number)
  @Min(0)
  points!: number;

  @IsOptional()
  @IsString()
  reason?: string;
}

export class AdapterCheckoutDto {
  @ValidateNested()
  @Type(() => CreateOrderDto)
  order!: CreateOrderDto;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdapterPaymentDto)
  payment?: AdapterPaymentDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AdapterPaymentDto)
  payments?: AdapterPaymentDto[];

  @IsOptional()
  @IsBoolean()
  reserve_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  capture_payment?: boolean;

  @IsOptional()
  @IsIn(PAYMENT_PLANS)
  payment_plan?: (typeof PAYMENT_PLANS)[number];

  @IsOptional()
  @IsBoolean()
  release_on_partial?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdapterLoyaltyDto)
  loyalty?: AdapterLoyaltyDto;
}
