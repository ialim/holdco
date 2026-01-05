import { IsOptional, IsString, IsUUID } from "class-validator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListPosDevicesDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsUUID()
  location_id?: string;

  @IsOptional()
  @IsString()
  device_id?: string;
}
