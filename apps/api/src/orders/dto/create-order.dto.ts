import { IsArray, IsBoolean, IsOptional, IsString, IsUUID, Matches, Min, ValidateNested } from "class-validator";
import { Type } from "class-transformer";
import { CreateOrderItemDto } from "./create-order-item.dto";

export class CreateOrderDto {
  @IsOptional()
  @IsUUID()
  customer_id?: string;

  @IsOptional()
  @IsUUID()
  reseller_id?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  discount_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  tax_amount?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  shipping_amount?: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  allow_credit_override?: boolean;
}
