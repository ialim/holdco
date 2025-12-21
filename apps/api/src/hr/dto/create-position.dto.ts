import { IsNotEmpty, IsOptional, IsString, MinLength } from "class-validator";

export class CreatePositionDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  title!: string;

  @IsOptional()
  @IsString()
  level?: string;
}
