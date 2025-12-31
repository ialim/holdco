import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Min, ValidateNested } from "class-validator";
import { ImportShipmentLineDto } from "./import-shipment-line.dto";

export class CreateImportShipmentDto {
  @IsString()
  reference!: string;

  @IsOptional()
  @IsUUID()
  supplier_id?: string;

  @IsString()
  currency!: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  fx_rate!: number;

  @IsOptional()
  @IsDateString()
  arrival_date?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportShipmentLineDto)
  @ArrayMinSize(1)
  lines!: ImportShipmentLineDto[];
}
