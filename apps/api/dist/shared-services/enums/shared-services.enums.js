"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServiceRequestPriority = exports.ServiceRequestStatus = exports.ServiceRequestCategory = exports.ThirdPartyStatus = exports.ThirdPartyType = void 0;
var ThirdPartyType;
(function (ThirdPartyType) {
    ThirdPartyType["CLIENT"] = "client";
    ThirdPartyType["VENDOR"] = "vendor";
    ThirdPartyType["PARTNER"] = "partner";
})(ThirdPartyType || (exports.ThirdPartyType = ThirdPartyType = {}));
var ThirdPartyStatus;
(function (ThirdPartyStatus) {
    ThirdPartyStatus["ACTIVE"] = "active";
    ThirdPartyStatus["INACTIVE"] = "inactive";
})(ThirdPartyStatus || (exports.ThirdPartyStatus = ThirdPartyStatus = {}));
var ServiceRequestCategory;
(function (ServiceRequestCategory) {
    ServiceRequestCategory["MANAGEMENT"] = "management";
    ServiceRequestCategory["ADMINISTRATIVE"] = "administrative";
    ServiceRequestCategory["FINANCIAL"] = "financial";
    ServiceRequestCategory["ACCOUNTING"] = "accounting";
    ServiceRequestCategory["AUDITING"] = "auditing";
    ServiceRequestCategory["HUMAN_RESOURCES"] = "human_resources";
    ServiceRequestCategory["COMPLIANCE"] = "compliance";
    ServiceRequestCategory["RISK_MANAGEMENT"] = "risk_management";
    ServiceRequestCategory["PROCUREMENT"] = "procurement";
    ServiceRequestCategory["BUSINESS_ADVISORY"] = "business_advisory";
})(ServiceRequestCategory || (exports.ServiceRequestCategory = ServiceRequestCategory = {}));
var ServiceRequestStatus;
(function (ServiceRequestStatus) {
    ServiceRequestStatus["OPEN"] = "open";
    ServiceRequestStatus["APPROVED"] = "approved";
    ServiceRequestStatus["REJECTED"] = "rejected";
    ServiceRequestStatus["IN_PROGRESS"] = "in_progress";
    ServiceRequestStatus["ON_HOLD"] = "on_hold";
    ServiceRequestStatus["COMPLETED"] = "completed";
    ServiceRequestStatus["CANCELLED"] = "cancelled";
})(ServiceRequestStatus || (exports.ServiceRequestStatus = ServiceRequestStatus = {}));
var ServiceRequestPriority;
(function (ServiceRequestPriority) {
    ServiceRequestPriority["LOW"] = "low";
    ServiceRequestPriority["NORMAL"] = "normal";
    ServiceRequestPriority["HIGH"] = "high";
    ServiceRequestPriority["URGENT"] = "urgent";
})(ServiceRequestPriority || (exports.ServiceRequestPriority = ServiceRequestPriority = {}));
//# sourceMappingURL=shared-services.enums.js.map