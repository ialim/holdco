import { IsDateString, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";
import { ServiceRequestCategory, ServiceRequestPriority } from "../enums/shared-services.enums";

export class CreateServiceRequestDto {
  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsUUID()
  external_client_id?: string;

  @IsEnum(ServiceRequestCategory)
  category!: ServiceRequestCategory;

  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ServiceRequestPriority)
  priority?: ServiceRequestPriority;

  @IsOptional()
  @IsUUID()
  assigned_to?: string;

  @IsOptional()
  @IsDateString()
  due_at?: string;
}
