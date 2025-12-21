import { IsDateString, IsNotEmpty, IsOptional, IsString, IsUUID, MinLength } from "class-validator";

export class CreateEmployeeDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  employee_no!: string;

  @IsOptional()
  @IsUUID()
  user_id?: string;

  @IsOptional()
  @IsUUID()
  department_id?: string;

  @IsOptional()
  @IsUUID()
  position_id?: string;

  @IsOptional()
  @IsDateString()
  hired_at?: string;
}
