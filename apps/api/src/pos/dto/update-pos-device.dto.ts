import { IsIn, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

const STATUSES = ["active", "inactive", "retired"] as const;

export class UpdatePosDeviceDto {
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];

  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}
