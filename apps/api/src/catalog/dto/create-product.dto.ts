import { IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  sku!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsUUID()
  brand_id?: string;
}
