import { Type } from "class-transformer";
import { IsNumber, IsOptional, IsString, Matches, Min } from "class-validator";

export class CreatePosCashDropDto {
  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Z]{3}$/)
  currency?: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
