import { IsIn, IsOptional, IsUUID } from "class-validator";
import { ListQueryDto } from "../../common/dto/list-query.dto";

const PROVIDERS = ["paystack", "flutterwave", "moniepoint", "monnify", "interswitch"] as const;
const ENVIRONMENTS = ["test", "live"] as const;
const STATUSES = ["draft", "submitted", "approved", "rejected"] as const;

export class ListPaymentProviderConfigsDto extends ListQueryDto {
  @IsOptional()
  @IsUUID()
  subsidiary_id?: string;

  @IsOptional()
  @IsIn(PROVIDERS)
  provider?: (typeof PROVIDERS)[number];

  @IsOptional()
  @IsIn(ENVIRONMENTS)
  environment?: (typeof ENVIRONMENTS)[number];

  @IsOptional()
  @IsIn(STATUSES)
  status?: (typeof STATUSES)[number];
}
