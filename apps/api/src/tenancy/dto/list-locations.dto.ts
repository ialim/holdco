import { IsOptional, IsString, IsUUID } from "class-validator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListLocationsDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsString()
  type?: string;
}
