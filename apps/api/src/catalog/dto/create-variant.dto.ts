import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateVariantDto {
  @IsUUID()
  product_id!: string;

  @IsOptional()
  @IsString()
  size?: string;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  barcode?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
