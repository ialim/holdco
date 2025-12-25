import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateFacetDefinitionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  key!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsIn(["product", "variant"])
  scope?: string;

  @IsOptional()
  @IsIn(["text"])
  data_type?: string;
}
