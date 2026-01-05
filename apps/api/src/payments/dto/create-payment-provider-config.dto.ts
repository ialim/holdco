import { IsDateString, IsEmail, IsIn, IsOptional, IsString, IsUUID, Matches } from "class-validator";

const PROVIDERS = ["paystack", "flutterwave", "monnify", "interswitch"] as const;
const ENVIRONMENTS = ["test", "live"] as const;
const STATUSES = ["draft", "submitted", "approved", "rejected"] as const;

export class CreatePaymentProviderConfigDto {
  @IsUUID()
  subsidiary_id!: string;

  @IsIn(PROVIDERS)
  provider!: (typeof PROVIDERS)[number];

  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: (typeof ENVIRONMENTS)[number];

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsString()
  settlement_account_name?: string;

  @IsOptional()
  @IsString()
  settlement_account_number?: string;

  @IsOptional()
  @IsString()
  settlement_bank_name?: string;

  @IsOptional()
  @IsString()
  settlement_bank_code?: string;

  @IsOptional()
  @Matches(/^[A-Z]{3}$/)
  settlement_currency?: string;

  @IsOptional()
  @IsString()
  contact_name?: string;

  @IsOptional()
  @IsEmail()
  contact_email?: string;

  @IsOptional()
  @IsString()
  contact_phone?: string;

  @IsOptional()
  @IsString()
  provider_merchant_id?: string;

  @IsOptional()
  @IsDateString()
  kyc_submitted_at?: string;

  @IsOptional()
  @IsDateString()
  kyc_approved_at?: string;

  @IsOptional()
  @IsString()
  kyc_notes?: string;
}
