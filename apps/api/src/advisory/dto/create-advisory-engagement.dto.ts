import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export enum AdvisoryEngagementStatus {
  Active = "active",
  OnHold = "on_hold",
  Completed = "completed",
  Cancelled = "cancelled",
}

export class CreateAdvisoryEngagementDto {
  @IsOptional()
  @IsUUID()
  external_client_id?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsEnum(AdvisoryEngagementStatus)
  status?: AdvisoryEngagementStatus;

  @IsOptional()
  @IsDateString()
  start_at?: string;

  @IsOptional()
  @IsDateString()
  end_at?: string;

  @IsOptional()
  @IsUUID()
  lead_id?: string;
}
