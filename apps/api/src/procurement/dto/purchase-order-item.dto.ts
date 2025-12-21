import { Type } from "class-transformer";
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from "class-validator";

export class PurchaseOrderItemDto {
  @IsString()
  @IsNotEmpty()
  description!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @Min(0)
  unit_price!: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  total_price?: number;
}
