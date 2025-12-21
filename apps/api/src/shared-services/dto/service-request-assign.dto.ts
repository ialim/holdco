import { IsDateString, IsEnum, IsOptional, IsUUID } from "class-validator";
import { ServiceRequestPriority } from "../enums/shared-services.enums";

export class ServiceRequestAssignDto {
  @IsUUID()
  assigned_to!: string;

  @IsOptional()
  @IsDateString()
  due_at?: string;

  @IsOptional()
  @IsEnum(ServiceRequestPriority)
  priority?: ServiceRequestPriority;
}
