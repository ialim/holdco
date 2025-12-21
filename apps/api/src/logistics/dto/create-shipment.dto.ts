import { IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateShipmentDto {
  @IsUUID()
  order_id!: string;

  @IsString()
  @IsNotEmpty()
  carrier!: string;

  @IsOptional()
  @IsString()
  tracking_no?: string;
}
