import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsString, ValidateNested } from "class-validator";

export class CategoryFacetFilterDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;
}

export class CategoryFilterGroupDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CategoryFacetFilterDto)
  all!: CategoryFacetFilterDto[];
}
