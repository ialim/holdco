import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { ThirdPartyType } from "../enums/shared-services.enums";

export class CreateThirdPartyDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEnum(ThirdPartyType)
  type!: ThirdPartyType;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;
}
