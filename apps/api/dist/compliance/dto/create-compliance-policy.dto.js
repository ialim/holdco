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
exports.CreateCompliancePolicyDto = exports.CompliancePolicyStatus = void 0;
const class_validator_1 = require("class-validator");
var CompliancePolicyStatus;
(function (CompliancePolicyStatus) {
    CompliancePolicyStatus["Active"] = "active";
    CompliancePolicyStatus["Archived"] = "archived";
})(CompliancePolicyStatus || (exports.CompliancePolicyStatus = CompliancePolicyStatus = {}));
class CreateCompliancePolicyDto {
}
exports.CreateCompliancePolicyDto = CreateCompliancePolicyDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateCompliancePolicyDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCompliancePolicyDto.prototype, "version", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CompliancePolicyStatus),
    __metadata("design:type", String)
], CreateCompliancePolicyDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCompliancePolicyDto.prototype, "effective_at", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateCompliancePolicyDto.prototype, "review_at", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateCompliancePolicyDto.prototype, "owner_id", void 0);
//# sourceMappingURL=create-compliance-policy.dto.js.map