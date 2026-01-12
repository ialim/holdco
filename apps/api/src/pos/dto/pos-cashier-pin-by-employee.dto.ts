import { IsString, MaxLength, MinLength, Matches } from "class-validator";

export class PosCashierPinByEmployeeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(32)
  employee_no!: string;

  @IsString()
  @MinLength(4)
  @MaxLength(12)
  @Matches(/^[0-9]+$/, { message: "PIN must be numeric" })
  pin!: string;
}
