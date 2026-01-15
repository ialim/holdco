import { IsEmail, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateAppUserDto {
  @IsEmail()
  email!: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsUUID()
  role_id!: string;

  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;
}
