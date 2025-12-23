import { Type } from "class-transformer";
import { IsOptional, IsString, Min, ValidateNested } from "class-validator";

class ResellerDetailsDto {
  @IsString()
  name!: string;

  @IsOptional()
  @IsString()
  status?: string;
}

class ResellerCreditDto {
  @Type(() => Number)
  @Min(0)
  limit_amount!: number;
}

export class ResellerOnboardDto {
  @ValidateNested()
  @Type(() => ResellerDetailsDto)
  reseller!: ResellerDetailsDto;

  @ValidateNested()
  @Type(() => ResellerCreditDto)
  credit!: ResellerCreditDto;
}
