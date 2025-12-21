import { IsInt, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { Type } from "class-transformer";

export class StockAdjustmentDto {
  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsUUID()
  location_id!: string;

  @Type(() => Number)
  @IsInt()
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  reason!: string;
}
