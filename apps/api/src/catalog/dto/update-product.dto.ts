import { Type } from "class-transformer";
import { IsArray, IsOptional, IsString, IsUUID, MinLength, ValidateNested } from "class-validator";
import { FacetInputDto } from "./facet-input.dto";

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  sku?: string;

  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  @IsOptional()
  @IsUUID()
  brand_id?: string;

  @IsOptional()
  @IsString()
  sex?: string;

  @IsOptional()
  @IsString()
  concentration?: string;

  @IsOptional()
  @IsString()
  type?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => FacetInputDto)
  facets?: FacetInputDto[];
}
