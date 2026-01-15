import { IsOptional, IsString } from "class-validator";

export class UpdateIamUserAttributesDto {
  @IsOptional()
  @IsString()
  group_id?: string;

  @IsOptional()
  @IsString()
  subsidiary_id?: string;

  @IsOptional()
  @IsString()
  location_id?: string;
}
