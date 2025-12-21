export enum ThirdPartyType {
  CLIENT = "client",
  VENDOR = "vendor",
  PARTNER = "partner",
}

export enum ThirdPartyStatus {
  ACTIVE = "active",
  INACTIVE = "inactive",
}

export enum ServiceRequestCategory {
  MANAGEMENT = "management",
  ADMINISTRATIVE = "administrative",
  FINANCIAL = "financial",
  ACCOUNTING = "accounting",
  AUDITING = "auditing",
  HUMAN_RESOURCES = "human_resources",
  COMPLIANCE = "compliance",
  RISK_MANAGEMENT = "risk_management",
  PROCUREMENT = "procurement",
  BUSINESS_ADVISORY = "business_advisory",
}

export enum ServiceRequestStatus {
  OPEN = "open",
  APPROVED = "approved",
  REJECTED = "rejected",
  IN_PROGRESS = "in_progress",
  ON_HOLD = "on_hold",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum ServiceRequestPriority {
  LOW = "low",
  NORMAL = "normal",
  HIGH = "high",
  URGENT = "urgent",
}
