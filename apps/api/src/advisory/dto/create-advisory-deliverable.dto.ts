import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export enum AdvisoryDeliverableStatus {
  Open = "open",
  InProgress = "in_progress",
  Delivered = "delivered",
  Accepted = "accepted",
  Rejected = "rejected",
}

export class CreateAdvisoryDeliverableDto {
  @IsUUID()
  advisory_engagement_id!: string;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsEnum(AdvisoryDeliverableStatus)
  status?: AdvisoryDeliverableStatus;

  @IsOptional()
  @IsDateString()
  due_at?: string;

  @IsOptional()
  @IsDateString()
  delivered_at?: string;
}
