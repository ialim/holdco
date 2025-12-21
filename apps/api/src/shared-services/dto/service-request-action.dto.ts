import { IsOptional, IsString } from "class-validator";

export class ServiceRequestActionDto {
  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  comment?: string;
}
