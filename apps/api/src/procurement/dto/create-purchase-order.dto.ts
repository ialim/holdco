import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { PurchaseOrderItemDto } from "./purchase-order-item.dto";

export class CreatePurchaseOrderDto {
  @IsUUID()
  vendor_id!: string;

  @IsOptional()
  @IsDateString()
  ordered_at?: string;

  @IsOptional()
  @IsDateString()
  expected_at?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseOrderItemDto)
  @ArrayMinSize(1)
  items!: PurchaseOrderItemDto[];
}
