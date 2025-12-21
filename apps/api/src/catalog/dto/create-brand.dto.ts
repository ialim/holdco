import { IsNotEmpty, IsString, MinLength } from "class-validator";

export class CreateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  name!: string;
}
