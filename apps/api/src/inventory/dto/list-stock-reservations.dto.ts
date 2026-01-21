import { IsOptional, IsString, IsUUID } from "class-validator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListStockReservationsDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  location_id?: string;

  @IsOptional()
  @IsUUID()
  product_id?: string;

  @IsOptional()
  @IsUUID()
  variant_id?: string;

  @IsOptional()
  @IsUUID()
  order_id?: string;

  @IsOptional()
  @IsString()
  status?: string;
}
