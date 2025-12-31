import { Type } from "class-transformer";
import { IsInt, IsOptional, IsUUID, Min } from "class-validator";

export class ReceiveImportShipmentLineDto {
  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity_received!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  quantity_rejected?: number;
}
