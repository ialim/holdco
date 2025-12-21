export enum LedgerAccountType {
  REVENUE = "REVENUE",
  COGS = "COGS",
  EXPENSE = "EXPENSE",
}

export enum AllocationMethod {
  BY_FIXED_SPLIT = "BY_FIXED_SPLIT",
}

export enum InvoiceStatus {
  DRAFT = "DRAFT",
  ISSUED = "ISSUED",
  PART_PAID = "PART_PAID",
  PAID = "PAID",
  VOID = "VOID",
}

export enum InvoiceType {
  INTERCOMPANY = "INTERCOMPANY",
  EXTERNAL = "EXTERNAL",
}

export enum TaxType {
  SERVICES = "SERVICES",
  GOODS = "GOODS",
  RENT = "RENT",
  INTEREST = "INTEREST",
  ROYALTIES = "ROYALTIES",
}

export enum AgreementType {
  MANAGEMENT = "MANAGEMENT",
  IP_LICENSE = "IP_LICENSE",
}

export enum PricingModel {
  COST_PLUS = "COST_PLUS",
  FIXED_MONTHLY = "FIXED_MONTHLY",
}
