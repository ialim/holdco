import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreateResellerDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;
}
