"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PricingModel = exports.AgreementType = exports.TaxType = exports.InvoiceType = exports.InvoiceStatus = exports.AllocationMethod = exports.LedgerAccountType = void 0;
var LedgerAccountType;
(function (LedgerAccountType) {
    LedgerAccountType["REVENUE"] = "REVENUE";
    LedgerAccountType["COGS"] = "COGS";
    LedgerAccountType["EXPENSE"] = "EXPENSE";
})(LedgerAccountType || (exports.LedgerAccountType = LedgerAccountType = {}));
var AllocationMethod;
(function (AllocationMethod) {
    AllocationMethod["BY_FIXED_SPLIT"] = "BY_FIXED_SPLIT";
})(AllocationMethod || (exports.AllocationMethod = AllocationMethod = {}));
var InvoiceStatus;
(function (InvoiceStatus) {
    InvoiceStatus["DRAFT"] = "DRAFT";
    InvoiceStatus["ISSUED"] = "ISSUED";
    InvoiceStatus["PART_PAID"] = "PART_PAID";
    InvoiceStatus["PAID"] = "PAID";
    InvoiceStatus["VOID"] = "VOID";
})(InvoiceStatus || (exports.InvoiceStatus = InvoiceStatus = {}));
var InvoiceType;
(function (InvoiceType) {
    InvoiceType["INTERCOMPANY"] = "INTERCOMPANY";
    InvoiceType["EXTERNAL"] = "EXTERNAL";
})(InvoiceType || (exports.InvoiceType = InvoiceType = {}));
var TaxType;
(function (TaxType) {
    TaxType["SERVICES"] = "SERVICES";
    TaxType["GOODS"] = "GOODS";
    TaxType["RENT"] = "RENT";
    TaxType["INTEREST"] = "INTEREST";
    TaxType["ROYALTIES"] = "ROYALTIES";
})(TaxType || (exports.TaxType = TaxType = {}));
var AgreementType;
(function (AgreementType) {
    AgreementType["MANAGEMENT"] = "MANAGEMENT";
    AgreementType["IP_LICENSE"] = "IP_LICENSE";
})(AgreementType || (exports.AgreementType = AgreementType = {}));
var PricingModel;
(function (PricingModel) {
    PricingModel["COST_PLUS"] = "COST_PLUS";
    PricingModel["FIXED_MONTHLY"] = "FIXED_MONTHLY";
})(PricingModel || (exports.PricingModel = PricingModel = {}));
//# sourceMappingURL=finance.enums.js.map