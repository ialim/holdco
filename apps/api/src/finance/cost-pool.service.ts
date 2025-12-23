import { Injectable, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Decimal } from "@prisma/client/runtime/library";
import { AllocationMethod } from "./finance.enums";
import { assertCompaniesInGroup, assertCompanyInGroup, requireGroupId } from "./finance-tenancy";

@Injectable()
export class CostPoolService {
  constructor(private readonly prisma: PrismaService) {}

  async createCostPool(params: {
    groupId: string;
    holdcoCompanyId: string;
    period: string; // "YYYY-MM"
    lines: { category: string; amount: Decimal | string | number }[];
    allocationMethod?: AllocationMethod;
    weights?: { recipientCompanyId: string; weight: Decimal | string | number }[];
  }) {
    requireGroupId(params.groupId);
    await assertCompanyInGroup(this.prisma, params.groupId, params.holdcoCompanyId, "Holding company");
    if (params.weights?.length) {
      await assertCompaniesInGroup(
        this.prisma,
        params.groupId,
        params.weights.map((w) => w.recipientCompanyId),
        "Recipient company",
      );
    }

    const totalCost = params.lines.reduce((sum, l) => sum.plus(new Decimal(l.amount)), new Decimal(0));

    const costPool = await this.prisma.costPool.upsert({
      where: { companyId_period: { companyId: params.holdcoCompanyId, period: params.period } },
      update: {
        totalCost,
        lines: { deleteMany: {}, create: params.lines.map((l) => ({ category: l.category, amount: new Decimal(l.amount) })) },
      },
      create: {
        companyId: params.holdcoCompanyId,
        period: params.period,
        totalCost,
        lines: { create: params.lines.map((l) => ({ category: l.category, amount: new Decimal(l.amount) })) },
      },
      include: { lines: true },
    });

    const method = params.allocationMethod ?? AllocationMethod.BY_FIXED_SPLIT;

    const rule = await this.prisma.allocationRule.upsert({
      where: { costPoolId: costPool.id },
      update: { method },
      create: { costPoolId: costPool.id, method },
    });

    if (method === AllocationMethod.BY_FIXED_SPLIT) {
      if (!params.weights?.length) throw new BadRequestException("BY_FIXED_SPLIT requires weights");

      const sum = params.weights.reduce((s, w) => s.plus(new Decimal(w.weight)), new Decimal(0));
      if (sum.lessThan(new Decimal("0.999")) || sum.greaterThan(new Decimal("1.001"))) {
        throw new BadRequestException(`Weights must sum to 1.0 (got ${sum.toString()})`);
      }

      await this.prisma.allocationWeight.deleteMany({ where: { allocationRuleId: rule.id } });

      await this.prisma.allocationWeight.createMany({
        data: params.weights.map((w) => ({
          allocationRuleId: rule.id,
          recipientCompanyId: w.recipientCompanyId,
          weight: new Decimal(w.weight),
        })),
      });
    }

    return { costPoolId: costPool.id, totalCost: costPool.totalCost };
  }

  async allocateCostPool(groupId: string, costPoolId: string) {
    requireGroupId(groupId);

    const pool = await this.prisma.costPool.findFirst({
      where: { id: costPoolId, company: { groupId } },
      include: { allocationRule: { include: { weights: true } } },
    });
    if (!pool) throw new BadRequestException("CostPool not found");
    if (!pool.allocationRule) throw new BadRequestException("AllocationRule not found");
    if (pool.allocationRule.method !== AllocationMethod.BY_FIXED_SPLIT) {
      throw new BadRequestException("Only BY_FIXED_SPLIT implemented in conservative default");
    }
    if (!pool.allocationRule.weights.length) throw new BadRequestException("No allocation weights set");

    await this.prisma.costAllocation.deleteMany({ where: { costPoolId: pool.id } });

    const allocations = pool.allocationRule.weights.map((w: any) => ({
      costPoolId: pool.id,
      recipientCompanyId: w.recipientCompanyId,
      allocatedCost: new Decimal(pool.totalCost).mul(w.weight),
    }));

    await this.prisma.costAllocation.createMany({ data: allocations });

    return { costPoolId: pool.id, allocationsCount: allocations.length };
  }
}
