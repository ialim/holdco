import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateLeaveRequestDto {
  @IsUUID()
  employee_id!: string;

  @IsString()
  @IsNotEmpty()
  type!: string;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsOptional()
  @IsString()
  reason?: string;
}
