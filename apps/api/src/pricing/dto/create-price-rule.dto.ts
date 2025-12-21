import { IsInt, IsNotEmpty, IsOptional, IsUUID, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreatePriceRuleDto {
  @IsUUID()
  price_list_id!: string;

  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  min_qty!: number;

  @Type(() => Number)
  @IsNotEmpty()
  @Min(0)
  price!: number;
}
