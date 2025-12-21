"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateRiskRegisterItemDto = exports.RiskCategory = exports.RiskRegisterStatus = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var RiskRegisterStatus;
(function (RiskRegisterStatus) {
    RiskRegisterStatus["Open"] = "open";
    RiskRegisterStatus["Mitigated"] = "mitigated";
    RiskRegisterStatus["Accepted"] = "accepted";
    RiskRegisterStatus["Closed"] = "closed";
})(RiskRegisterStatus || (exports.RiskRegisterStatus = RiskRegisterStatus = {}));
var RiskCategory;
(function (RiskCategory) {
    RiskCategory["Strategic"] = "strategic";
    RiskCategory["Operational"] = "operational";
    RiskCategory["Financial"] = "financial";
    RiskCategory["Compliance"] = "compliance";
    RiskCategory["Reputational"] = "reputational";
    RiskCategory["Cyber"] = "cyber";
    RiskCategory["SupplyChain"] = "supply_chain";
    RiskCategory["Other"] = "other";
})(RiskCategory || (exports.RiskCategory = RiskCategory = {}));
class CreateRiskRegisterItemDto {
}
exports.CreateRiskRegisterItemDto = CreateRiskRegisterItemDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateRiskRegisterItemDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RiskCategory),
    __metadata("design:type", String)
], CreateRiskRegisterItemDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRiskRegisterItemDto.prototype, "likelihood", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRiskRegisterItemDto.prototype, "impact", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CreateRiskRegisterItemDto.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(RiskRegisterStatus),
    __metadata("design:type", String)
], CreateRiskRegisterItemDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateRiskRegisterItemDto.prototype, "owner_id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateRiskRegisterItemDto.prototype, "mitigation", void 0);
//# sourceMappingURL=create-risk-register.dto.js.map