import { IsNotEmpty, IsString } from "class-validator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

export class ListCategoryQueryDto extends ListQueryDto {
  @IsString()
  @IsNotEmpty()
  facet_key!: string;

  @IsString()
  @IsNotEmpty()
  facet_value!: string;
}
