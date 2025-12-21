import { IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreateOrderItemDto {
  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  unit_price?: number;
}
