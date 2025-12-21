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
exports.CreateComplianceAuditDto = exports.ComplianceAuditStatus = void 0;
const class_validator_1 = require("class-validator");
var ComplianceAuditStatus;
(function (ComplianceAuditStatus) {
    ComplianceAuditStatus["Planned"] = "planned";
    ComplianceAuditStatus["InProgress"] = "in_progress";
    ComplianceAuditStatus["Completed"] = "completed";
    ComplianceAuditStatus["Closed"] = "closed";
})(ComplianceAuditStatus || (exports.ComplianceAuditStatus = ComplianceAuditStatus = {}));
class CreateComplianceAuditDto {
}
exports.CreateComplianceAuditDto = CreateComplianceAuditDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsNotEmpty)(),
    __metadata("design:type", String)
], CreateComplianceAuditDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateComplianceAuditDto.prototype, "scope", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ComplianceAuditStatus),
    __metadata("design:type", String)
], CreateComplianceAuditDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComplianceAuditDto.prototype, "started_at", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateComplianceAuditDto.prototype, "completed_at", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateComplianceAuditDto.prototype, "lead_auditor_id", void 0);
//# sourceMappingURL=create-compliance-audit.dto.js.map