import { IsUUID } from "class-validator";

export class CreateLoyaltyAccountDto {
  @IsUUID()
  customer_id!: string;
}
