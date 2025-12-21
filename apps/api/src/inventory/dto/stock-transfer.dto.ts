import { IsInt, IsOptional, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class StockTransferDto {
  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsUUID()
  from_location_id!: string;

  @IsUUID()
  to_location_id!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  quantity!: number;
}
