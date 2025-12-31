import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { ReceiveImportShipmentLineDto } from "./receive-import-shipment-line.dto";

export class ReceiveImportShipmentDto {
  @IsUUID()
  location_id!: string;

  @IsOptional()
  @IsDateString()
  received_at?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiveImportShipmentLineDto)
  @ArrayMinSize(1)
  lines!: ReceiveImportShipmentLineDto[];
}
