import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, IsDateString, IsOptional, IsString, IsUUID, ValidateNested } from "class-validator";
import { PurchaseRequestItemDto } from "./purchase-request-item.dto";

export class CreatePurchaseRequestDto {
  @IsOptional()
  @IsUUID()
  requester_id?: string;

  @IsOptional()
  @IsDateString()
  needed_by?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseRequestItemDto)
  @ArrayMinSize(1)
  items!: PurchaseRequestItemDto[];
}
