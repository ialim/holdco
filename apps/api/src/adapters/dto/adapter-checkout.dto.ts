import { Type } from "class-transformer";
import { IsBoolean, IsOptional, IsString, IsUUID, Matches, Min, ValidateNested } from "class-validator";
import { CreateOrderDto } from "../../orders/dto/create-order.dto";

class AdapterPaymentDto {
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
  @IsBoolean()
  reserve_stock?: boolean;

  @IsOptional()
  @IsBoolean()
  capture_payment?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => AdapterLoyaltyDto)
  loyalty?: AdapterLoyaltyDto;
}
