import { Type } from "class-transformer";
import { IsDateString, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class ListQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  q?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  sort?: string;

  @IsOptional()
  @IsString()
  order?: string;

  @IsOptional()
  @IsString()
  channel?: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;

  @IsOptional()
  @IsString()
  facets?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsOptional()
  @IsUUID()
  reseller_id?: string;

  @IsOptional()
  @IsUUID()
  price_list_id?: string;

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;
}
