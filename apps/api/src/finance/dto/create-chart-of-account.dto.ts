import { IsIn, IsNotEmpty, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateChartOfAccountDto {
  @IsString()
  @IsNotEmpty()
  code!: string;

  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsIn(["asset", "liability", "equity", "income", "expense", "cogs"])
  type!: string;

  @IsOptional()
  @IsUUID()
  parent_id?: string;
}
