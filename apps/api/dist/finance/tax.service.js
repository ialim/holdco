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
exports.TaxService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
const finance_enums_1 = require("./finance.enums");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
let TaxService = class TaxService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateVatReturn(params) {
        const sold = await this.prisma.invoice.findMany({
            where: { sellerCompanyId: params.companyId, period: params.period, status: { not: finance_enums_1.InvoiceStatus.VOID } },
            select: { vatAmount: true },
        });
        const bought = await this.prisma.invoice.findMany({
            where: { buyerCompanyId: params.companyId, period: params.period, status: { not: finance_enums_1.InvoiceStatus.VOID } },
            select: { vatAmount: true },
        });
        const outputVat = round2(sold.reduce((s, i) => s.plus(dec(i.vatAmount)), dec(0)));
        const inputVat = round2(bought.reduce((s, i) => s.plus(dec(i.vatAmount)), dec(0)));
        const net = round2(outputVat.minus(inputVat));
        return this.prisma.vatReturn.upsert({
            where: { companyId_period: { companyId: params.companyId, period: params.period } },
            update: { outputVat, inputVat, netVatPayable: net },
            create: { companyId: params.companyId, period: params.period, outputVat, inputVat, netVatPayable: net },
        });
    }
    async fileVatReturn(params) {
        const vr = await this.prisma.vatReturn.findUnique({
            where: { companyId_period: { companyId: params.companyId, period: params.period } },
        });
        if (!vr)
            throw new Error("VAT return not generated yet");
        return this.prisma.vatReturn.update({
            where: { id: vr.id },
            data: { status: "FILED", filedAt: new Date(), paymentRef: params.paymentRef ?? vr.paymentRef },
        });
    }
};
exports.TaxService = TaxService;
exports.TaxService = TaxService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TaxService);
//# sourceMappingURL=tax.service.js.map