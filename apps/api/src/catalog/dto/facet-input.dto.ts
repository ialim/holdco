import { IsNotEmpty, IsString } from "class-validator";

export class FacetInputDto {
  @IsString()
  @IsNotEmpty()
  key!: string;

  @IsString()
  @IsNotEmpty()
  value!: string;
}
