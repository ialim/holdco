import { Type } from "class-transformer";
import { IsInt, IsNumber, IsOptional, IsUUID, Min } from "class-validator";

export class ImportShipmentLineDto {
  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsInt()
  @Min(1)
  quantity!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  unit_cost!: number;
}
