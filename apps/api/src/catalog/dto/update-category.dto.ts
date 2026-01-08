import { Type } from "class-transformer";
import { IsArray, IsIn, IsOptional, IsString, MaxLength, ValidateNested } from "class-validator";
import { CategoryFilterGroupDto } from "./category-filter.dto";

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(64)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @IsOptional()
  @IsString()
  @MaxLength(240)
  description?: string;

  @IsOptional()
  @IsString()
  @IsIn(["active", "inactive"])
  status?: string;

  @IsOptional()
  @Type(() => Number)
  sort_order?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryFilterGroupDto)
  product_filters?: CategoryFilterGroupDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryFilterGroupDto)
  variant_filters?: CategoryFilterGroupDto[];
}
