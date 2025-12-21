import { Type } from "class-transformer";
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, IsUUID, Min } from "class-validator";

export enum RiskRegisterStatus {
  Open = "open",
  Mitigated = "mitigated",
  Accepted = "accepted",
  Closed = "closed",
}

export enum RiskCategory {
  Strategic = "strategic",
  Operational = "operational",
  Financial = "financial",
  Compliance = "compliance",
  Reputational = "reputational",
  Cyber = "cyber",
  SupplyChain = "supply_chain",
  Other = "other",
}

export class CreateRiskRegisterItemDto {
  @IsString()
  @IsNotEmpty()
  title!: string;

  @IsOptional()
  @IsEnum(RiskCategory)
  category?: RiskCategory;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  likelihood?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  impact?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  score?: number;

  @IsOptional()
  @IsEnum(RiskRegisterStatus)
  status?: RiskRegisterStatus;

  @IsOptional()
  @IsUUID()
  owner_id?: string;

  @IsOptional()
  @IsString()
  mitigation?: string;
}
