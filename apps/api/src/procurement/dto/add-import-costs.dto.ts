import { Type } from "class-transformer";
import { ArrayMinSize, IsArray, ValidateNested } from "class-validator";
import { ImportCostLineDto } from "./import-cost-line.dto";

export class AddImportCostsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportCostLineDto)
  @ArrayMinSize(1)
  costs!: ImportCostLineDto[];
}
