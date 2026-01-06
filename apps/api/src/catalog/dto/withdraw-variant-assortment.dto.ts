import { ArrayMinSize, IsArray, IsUUID } from "class-validator";

export class WithdrawVariantAssortmentDto {
  @IsUUID()
  subsidiary_id!: string;

  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  variant_ids!: string[];
}
