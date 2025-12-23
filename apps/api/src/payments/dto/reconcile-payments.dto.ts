import { IsDateString, IsOptional, IsString } from "class-validator";

export class ReconcilePaymentsDto {
  @IsOptional()
  @IsString()
  provider?: string;

  @IsOptional()
  @IsDateString()
  from?: string;

  @IsOptional()
  @IsDateString()
  to?: string;
}
