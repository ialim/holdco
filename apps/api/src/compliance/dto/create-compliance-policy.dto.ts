import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export enum CompliancePolicyStatus {
  Active = "active",
  Archived = "archived",
}

export class CreateCompliancePolicyDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  version?: string;

  @IsOptional()
  @IsEnum(CompliancePolicyStatus)
  status?: CompliancePolicyStatus;

  @IsOptional()
  @IsDateString()
  effective_at?: string;

  @IsOptional()
  @IsDateString()
  review_at?: string;

  @IsOptional()
  @IsUUID()
  owner_id?: string;
}
