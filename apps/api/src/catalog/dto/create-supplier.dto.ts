import { IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateSupplierDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsIn(["domestic", "foreign"])
  origin?: string;
}
