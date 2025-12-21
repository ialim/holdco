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
exports.PaymentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let PaymentsService = class PaymentsService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createPaymentIntent(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const status = body.capture_method === "manual" ? "requires_capture" : "requires_capture";
        const intent = await this.prisma.paymentIntent.create({
            data: {
                groupId,
                subsidiaryId,
                orderId: body.order_id,
                amount: body.amount,
                currency: body.currency,
                status,
                provider: body.provider,
            },
        });
        return {
            id: intent.id,
            order_id: intent.orderId,
            amount: Number(intent.amount),
            currency: intent.currency,
            status: intent.status,
            provider: intent.provider ?? undefined,
            reference: intent.reference ?? undefined,
        };
    }
    async capturePaymentIntent(groupId, subsidiaryId, paymentId) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const existing = await this.prisma.paymentIntent.findFirst({ where: { id: paymentId, groupId, subsidiaryId } });
        if (!existing)
            throw new common_1.NotFoundException("Payment intent not found");
        const intent = await this.prisma.paymentIntent.update({
            where: { id: paymentId },
            data: { status: "captured" },
        });
        return {
            id: intent.id,
            order_id: intent.orderId,
            amount: Number(intent.amount),
            currency: intent.currency,
            status: intent.status,
            provider: intent.provider ?? undefined,
            reference: intent.reference ?? undefined,
        };
    }
    async createRefund(groupId, subsidiaryId, body) {
        if (!groupId)
            throw new common_1.BadRequestException("X-Group-Id header is required");
        if (!subsidiaryId)
            throw new common_1.BadRequestException("X-Subsidiary-Id header is required");
        const refund = await this.prisma.refund.create({
            data: {
                groupId,
                subsidiaryId,
                paymentIntentId: body.payment_id,
                amount: body.amount,
                reason: body.reason,
                status: "pending",
            },
        });
        return {
            id: refund.id,
            payment_id: refund.paymentIntentId,
            amount: Number(refund.amount),
            status: refund.status,
        };
    }
};
exports.PaymentsService = PaymentsService;
exports.PaymentsService = PaymentsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PaymentsService);
//# sourceMappingURL=payments.service.js.map