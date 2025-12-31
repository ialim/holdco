import { Type } from "class-transformer";
import { IsNumber, IsOptional } from "class-validator";

export class TaxProvisionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  income_tax_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  education_tax_rate?: number;
}
