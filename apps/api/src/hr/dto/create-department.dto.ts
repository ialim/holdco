import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateDepartmentDto {
  @IsOptional()
  @IsString()
  code?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;
}
