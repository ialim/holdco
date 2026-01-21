import { IsUUID } from "class-validator";

export class ReleaseReservationsDto {
  @IsUUID()
  order_id!: string;
}
