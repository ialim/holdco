import { IsNotEmpty, IsString } from "class-validator";

export class CreateFacetValueDto {
  @IsString()
  @IsNotEmpty()
  value!: string;
}
