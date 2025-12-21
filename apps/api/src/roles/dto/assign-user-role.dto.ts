import { IsOptional, IsUUID } from "class-validator";

export class AssignUserRoleDto {
  @IsUUID()
  role_id!: string;

  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;
}
