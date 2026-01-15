import { ArrayNotEmpty, IsArray, IsOptional, IsString } from "class-validator";

export class AssignIamRoleDto {
  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  roles?: string[];
}
