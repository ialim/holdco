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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentsController = void 0;
const common_1 = require("@nestjs/common");
const permissions_decorator_1 = require("../auth/permissions.decorator");
const permissions_guard_1 = require("../auth/permissions.guard");
const create_payment_intent_dto_1 = require("./dto/create-payment-intent.dto");
const create_refund_dto_1 = require("./dto/create-refund.dto");
const payments_service_1 = require("./payments.service");
let PaymentsController = class PaymentsController {
    constructor(paymentsService) {
        this.paymentsService = paymentsService;
    }
    createPaymentIntent(groupId, subsidiaryId, body) {
        return this.paymentsService.createPaymentIntent(groupId, subsidiaryId, body);
    }
    capturePaymentIntent(groupId, subsidiaryId, paymentId) {
        return this.paymentsService.capturePaymentIntent(groupId, subsidiaryId, paymentId);
    }
    createRefund(groupId, subsidiaryId, body) {
        return this.paymentsService.createRefund(groupId, subsidiaryId, body);
    }
};
exports.PaymentsController = PaymentsController;
__decorate([
    (0, permissions_decorator_1.Permissions)("payments.intent.create"),
    (0, common_1.Post)("payments/intents"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_payment_intent_dto_1.CreatePaymentIntentDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createPaymentIntent", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("payments.capture"),
    (0, common_1.Post)("payments/:payment_id/capture"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Param)("payment_id", new common_1.ParseUUIDPipe())),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "capturePaymentIntent", null);
__decorate([
    (0, permissions_decorator_1.Permissions)("payments.refund"),
    (0, common_1.Post)("refunds"),
    __param(0, (0, common_1.Headers)("x-group-id")),
    __param(1, (0, common_1.Headers)("x-subsidiary-id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, create_refund_dto_1.CreateRefundDto]),
    __metadata("design:returntype", void 0)
], PaymentsController.prototype, "createRefund", null);
exports.PaymentsController = PaymentsController = __decorate([
    (0, common_1.Controller)("v1"),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, common_1.UsePipes)(new common_1.ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true })),
    __metadata("design:paramtypes", [payments_service_1.PaymentsService])
], PaymentsController);
//# sourceMappingURL=payments.controller.js.map