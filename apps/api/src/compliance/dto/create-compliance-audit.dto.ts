import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export enum ComplianceAuditStatus {
  Planned = "planned",
  InProgress = "in_progress",
  Completed = "completed",
  Closed = "closed",
}

export class CreateComplianceAuditDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  scope?: string;

  @IsOptional()
  @IsEnum(ComplianceAuditStatus)
  status?: ComplianceAuditStatus;

  @IsOptional()
  @IsDateString()
  started_at?: string;

  @IsOptional()
  @IsDateString()
  completed_at?: string;

  @IsOptional()
  @IsUUID()
  lead_auditor_id?: string;
}
