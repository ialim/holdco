import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreateFiscalPeriodDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsDateString()
  start_date!: string;

  @IsDateString()
  end_date!: string;

  @IsOptional()
  @IsIn(["open", "closed", "locked"])
  status?: string;
}
