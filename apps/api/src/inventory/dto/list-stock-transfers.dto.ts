import { IsOptional, IsString, IsUUID } from "class-validator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListStockTransfersDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  from_location_id?: string;

  @IsOptional()
  @IsUUID()
  to_location_id?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
