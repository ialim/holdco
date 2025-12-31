import { IsDateString, IsEnum, IsOptional, IsString, IsUUID } from "class-validator";
import { TaxProvisionType } from "../finance.enums";

export class FileTaxProvisionDto {
  @IsUUID()
  company_id!: string;

  @IsString()
  period!: string;

  @IsEnum(TaxProvisionType)
  tax_type!: TaxProvisionType;

  @IsOptional()
  @IsString()
  payment_ref?: string;

  @IsOptional()
  @IsDateString()
  paid_at?: string;
}
