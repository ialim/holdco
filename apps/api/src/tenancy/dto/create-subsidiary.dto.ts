import { Type } from "class-transformer";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, ValidateNested } from "class-validator";
import { SubsidiaryRole } from "@prisma/client";
import { CreateSubsidiaryLocationDto } from "./create-subsidiary-location.dto";

export class CreateSubsidiaryDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(SubsidiaryRole)
  role!: SubsidiaryRole;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsBoolean()
  create_default_location?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => CreateSubsidiaryLocationDto)
  location?: CreateSubsidiaryLocationDto;
}
