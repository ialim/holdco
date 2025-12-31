import { Type } from "class-transformer";
import { IsBoolean, IsDateString, IsEnum, IsNumber, IsOptional, IsUUID } from "class-validator";
import { AgreementType, PricingModel, TaxType } from "../finance.enums";

export class CreateIntercompanyAgreementDto {
  @IsUUID()
  provider_company_id!: string;

  @IsUUID()
  recipient_company_id!: string;

  @IsEnum(AgreementType)
  type!: AgreementType;

  @IsEnum(PricingModel)
  pricing_model!: PricingModel;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  markup_rate?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  fixed_fee_amount?: number;

  @IsOptional()
  @IsBoolean()
  vat_applies?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  vat_rate?: number;

  @IsOptional()
  @IsBoolean()
  wht_applies?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  wht_rate?: number;

  @IsOptional()
  @IsEnum(TaxType)
  wht_tax_type?: TaxType;

  @IsDateString()
  effective_from!: string;

  @IsOptional()
  @IsDateString()
  effective_to?: string;
}
