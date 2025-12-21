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
exports.WhtRemittanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const library_1 = require("@prisma/client/runtime/library");
function dec(v) { return new library_1.Decimal(v); }
function round2(d) { return new library_1.Decimal(d.toFixed(2)); }
let WhtRemittanceService = class WhtRemittanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getWhtSchedule(params) {
        const notes = await this.prisma.whtCreditNote.findMany({
            where: { issuerCompanyId: params.issuerCompanyId, period: params.period, remittanceDate: null },
        });
        const grouped = {};
        for (const n of notes) {
            const key = n.taxType;
            const prev = grouped[key]?.amount ? dec(grouped[key].amount) : dec(0);
            const next = prev.plus(dec(n.amount));
            grouped[key] = { taxType: n.taxType, amount: round2(next).toString(), count: (grouped[key]?.count ?? 0) + 1 };
        }
        return {
            issuerCompanyId: params.issuerCompanyId,
            period: params.period,
            items: Object.values(grouped),
            total: round2(Object.values(grouped).reduce((s, i) => s.plus(dec(i.amount)), dec(0))).toString(),
        };
    }
    async markRemitted(params) {
        const result = await this.prisma.whtCreditNote.updateMany({
            where: { issuerCompanyId: params.issuerCompanyId, period: params.period, taxType: params.taxType, remittanceDate: null },
            data: { remittanceDate: params.remittanceDate, firReceiptRef: params.firReceiptRef },
        });
        if (result.count === 0)
            throw new common_1.BadRequestException("No unremitted WHT credit notes found for the given filters");
        return { updatedCount: result.count };
    }
};
exports.WhtRemittanceService = WhtRemittanceService;
exports.WhtRemittanceService = WhtRemittanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WhtRemittanceService);
//# sourceMappingURL=wht-remittance.service.js.map