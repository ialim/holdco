import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export enum ComplianceTaskStatus {
  Open = "open",
  InProgress = "in_progress",
  Completed = "completed",
  Overdue = "overdue",
  Cancelled = "cancelled",
}

export class CreateComplianceTaskDto {
  @IsOptional()
  @IsUUID()
  policy_id?: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsEnum(ComplianceTaskStatus)
  status?: ComplianceTaskStatus;

  @IsOptional()
  @IsDateString()
  due_at?: string;

  @IsOptional()
  @IsUUID()
  assignee_id?: string;
}
