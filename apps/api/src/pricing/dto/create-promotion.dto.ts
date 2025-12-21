import { IsDateString, IsNotEmpty, IsString, Min } from "class-validator";
import { Type } from "class-transformer";

export class CreatePromotionDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @Type(() => Number)
  @Min(0)
  value!: number;

  @IsDateString()
  start_at!: string;

  @IsDateString()
  end_at!: string;
}
