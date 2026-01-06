import { IsOptional, IsString, IsUUID } from "class-validator";

export class ActivatePosDeviceDto {
  @IsString()
  device_id!: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;
}
