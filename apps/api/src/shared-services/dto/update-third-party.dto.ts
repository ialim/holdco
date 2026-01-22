import { Type } from "class-transformer";
import { IsDateString, IsEmail, IsEnum, IsIn, IsInt, IsNumber, IsOptional, IsString, Min } from "class-validator";
import { ThirdPartyStatus, ThirdPartyType } from "../enums/shared-services.enums";

export class UpdateThirdPartyDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(ThirdPartyType)
  type?: ThirdPartyType;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsIn(["domestic", "foreign"])
  origin?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  credit_limit?: number;

  @IsOptional()
  @IsString()
  credit_currency?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  payment_term_days?: number;

  @IsOptional()
  @IsString()
  negotiation_notes?: string;

  @IsOptional()
  @IsDateString()
  last_negotiated_at?: string;

  @IsOptional()
  @IsString()
  last_negotiated_by?: string;

  @IsOptional()
  @IsEnum(ThirdPartyStatus)
  status?: ThirdPartyStatus;
}
