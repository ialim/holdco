import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { IntercompanyAgreement, Prisma, SubsidiaryRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { AgreementType, PricingModel } from "./finance.enums";
import { assertCompanyInGroup, requireGroupId } from "./finance-tenancy";

type AgreementInput = {
  providerCompanyId: string;
  recipientCompanyId: string;
  type: AgreementType | string;
  pricingModel: PricingModel | string;
  markupRate?: number | string | Decimal | null;
  fixedFeeAmount?: number | string | Decimal | null;
  vatApplies: boolean;
  vatRate?: number | string | Decimal | null;
  whtApplies: boolean;
  whtRate?: number | string | Decimal | null;
  whtTaxType?: string | null;
  effectiveFrom: Date;
  effectiveTo?: Date | null;
};

const SAFE_RANGE_RULES: Record<string, { label: string; model: PricingModel; min: Decimal; max: Decimal }> = {
  [AgreementType.MANAGEMENT]: {
    label: "Management fees",
    model: PricingModel.COST_PLUS,
    min: new Decimal("0.05"),
    max: new Decimal("0.15"),
  },
  [AgreementType.PRODUCT_SUPPLY]: {
    label: "Product supply markup",
    model: PricingModel.COST_PLUS,
    min: new Decimal("0.03"),
    max: new Decimal("0.08"),
  },
  [AgreementType.LOGISTICS]: {
    label: "Logistics markup",
    model: PricingModel.COST_PLUS,
    min: new Decimal("0.05"),
    max: new Decimal("0.12"),
  },
  [AgreementType.IP_LICENSE]: {
    label: "IP royalty",
    model: PricingModel.ROYALTY_PERCENT,
    min: new Decimal("0.01"),
    max: new Decimal("0.03"),
  },
};

const AGREEMENT_ROLE_RULES: Record<string, { provider: SubsidiaryRole[]; recipients: SubsidiaryRole[] }> = {
  [AgreementType.MANAGEMENT]: {
    provider: [SubsidiaryRole.HOLDCO],
    recipients: [
      SubsidiaryRole.PROCUREMENT_TRADING,
      SubsidiaryRole.RETAIL,
      SubsidiaryRole.RESELLER,
      SubsidiaryRole.DIGITAL_COMMERCE,
      SubsidiaryRole.LOGISTICS,
    ],
  },
  [AgreementType.IP_LICENSE]: {
    provider: [SubsidiaryRole.HOLDCO],
    recipients: [
      SubsidiaryRole.PROCUREMENT_TRADING,
      SubsidiaryRole.RETAIL,
      SubsidiaryRole.RESELLER,
      SubsidiaryRole.DIGITAL_COMMERCE,
      SubsidiaryRole.LOGISTICS,
    ],
  },
  [AgreementType.PRODUCT_SUPPLY]: {
    provider: [SubsidiaryRole.PROCUREMENT_TRADING],
    recipients: [SubsidiaryRole.RETAIL, SubsidiaryRole.RESELLER, SubsidiaryRole.DIGITAL_COMMERCE],
  },
  [AgreementType.LOGISTICS]: {
    provider: [SubsidiaryRole.LOGISTICS],
    recipients: [
      SubsidiaryRole.PROCUREMENT_TRADING,
      SubsidiaryRole.RETAIL,
      SubsidiaryRole.RESELLER,
      SubsidiaryRole.DIGITAL_COMMERCE,
    ],
  },
};

function dec(value: number | string | Decimal | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Decimal(value);
}

function formatPercent(value: Decimal) {
  return value.mul(100).toFixed(2).replace(/\.00$/, "");
}

function assertPositive(value: Decimal | null, label: string) {
  if (!value || value.lte(0)) {
    throw new BadRequestException(`${label} must be greater than 0`);
  }
}

function assertWithinRange(rate: Decimal, rule: { label: string; min: Decimal; max: Decimal }) {
  if (rate.lessThan(rule.min) || rate.greaterThan(rule.max)) {
    throw new BadRequestException(
      `${rule.label} rate must be between ${formatPercent(rule.min)}% and ${formatPercent(rule.max)}%`,
    );
  }
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function isMonthStart(date: Date) {
  return date.getDate() === 1;
}

function isYearStart(date: Date) {
  return date.getMonth() === 0 && date.getDate() === 1;
}

function decimalChanged(a: Decimal | number | string | null | undefined, b: Decimal | number | string | null | undefined) {
  const left = dec(a);
  const right = dec(b);
  if (!left && !right) return false;
  if (!left || !right) return true;
  return !left.equals(right);
}

function pricingChanged(existing: IntercompanyAgreement, input: AgreementInput) {
  return (
    existing.pricingModel !== input.pricingModel ||
    decimalChanged(existing.markupRate, input.markupRate) ||
    decimalChanged(existing.fixedFeeAmount, input.fixedFeeAmount) ||
    existing.vatApplies !== input.vatApplies ||
    decimalChanged(existing.vatRate, input.vatRate) ||
    existing.whtApplies !== input.whtApplies ||
    decimalChanged(existing.whtRate, input.whtRate) ||
    (existing.whtTaxType ?? null) !== (input.whtTaxType ?? null)
  );
}

function validateAgreement(input: AgreementInput) {
  const rule = SAFE_RANGE_RULES[input.type];
  const pricingModel = input.pricingModel;
  const markupRate = dec(input.markupRate);
  const fixedFeeAmount = dec(input.fixedFeeAmount);

  if (pricingModel === PricingModel.COST_PLUS) {
    assertPositive(markupRate, "Markup rate");
  }
  if (pricingModel === PricingModel.ROYALTY_PERCENT) {
    assertPositive(markupRate, "Royalty rate");
  }
  if (pricingModel === PricingModel.FIXED_MONTHLY) {
    assertPositive(fixedFeeAmount, "Fixed fee amount");
  }

  if (rule) {
    if (pricingModel === rule.model) {
      assertPositive(markupRate, `${rule.label} rate`);
      assertWithinRange(markupRate!, rule);
    } else if (!(input.type === AgreementType.IP_LICENSE && pricingModel === PricingModel.FIXED_MONTHLY)) {
      throw new BadRequestException(`${input.type} agreements must use ${rule.model}`);
    }
  }

  if (input.vatApplies) {
    assertPositive(dec(input.vatRate), "VAT rate");
  }
  if (input.whtApplies) {
    assertPositive(dec(input.whtRate), "WHT rate");
  }
}

function assertEffectiveWindow(input: AgreementInput, existing?: IntercompanyAgreement) {
  const effectiveFromChanged = !existing || input.effectiveFrom.getTime() !== existing.effectiveFrom.getTime();
  const pricingNeedsReset = existing && pricingChanged(existing, input);
  const minEffectiveFrom = startOfMonth(new Date());

  if (effectiveFromChanged || pricingNeedsReset) {
    if (!isMonthStart(input.effectiveFrom)) {
      throw new BadRequestException("Effective from must start on the first day of a month");
    }
    if (input.effectiveFrom < minEffectiveFrom) {
      throw new BadRequestException("Backdating agreements is not allowed");
    }
  }

  if (input.effectiveTo && input.effectiveTo < input.effectiveFrom) {
    throw new BadRequestException("Effective to must be on or after effective from");
  }

  if (pricingNeedsReset && !isYearStart(input.effectiveFrom)) {
    throw new BadRequestException("Rate changes must take effect on Jan 1 (no mid-year changes)");
  }
}

function assertAgreementRoles(
  provider: { role: SubsidiaryRole | null; name: string },
  recipient: { role: SubsidiaryRole | null; name: string },
  type: AgreementType | string,
) {
  if (!provider.role || !recipient.role) {
    throw new BadRequestException("Subsidiary roles must be set before creating agreements");
  }

  const rule = AGREEMENT_ROLE_RULES[type];
  if (!rule) return;

  if (!rule.provider.includes(provider.role)) {
    throw new BadRequestException(`${type} agreements must be provided by ${rule.provider.join(", ")}`);
  }

  if (!rule.recipients.includes(recipient.role)) {
    throw new BadRequestException(`${type} agreements cannot be assigned to ${recipient.role} recipients`);
  }
}

function normalizeAgreementInput(input: AgreementInput) {
  const vatApplies = input.vatApplies ?? false;
  const whtApplies = input.whtApplies ?? false;

  return {
    ...input,
    vatApplies,
    whtApplies,
    vatRate: vatApplies ? input.vatRate : input.vatRate ?? 0,
    whtRate: whtApplies ? input.whtRate : input.whtRate ?? 0,
    whtTaxType: input.whtTaxType ?? null,
    effectiveTo: input.effectiveTo ?? null,
  };
}

@Injectable()
export class IntercompanyAgreementsService {
  constructor(private readonly prisma: PrismaService) {}

  async listAgreements(groupId: string, query: ListQueryDto) {
    requireGroupId(groupId);

    const where: Prisma.IntercompanyAgreementWhereInput = {
      OR: [{ providerCompany: { groupId } }, { recipientCompany: { groupId } }],
    };

    if (query.q) {
      where.AND = [
        {
          OR: [
            { type: { contains: query.q, mode: "insensitive" as const } },
            { providerCompany: { name: { contains: query.q, mode: "insensitive" as const } } },
            { recipientCompany: { name: { contains: query.q, mode: "insensitive" as const } } },
          ],
        },
      ];
    }

    const [total, agreements] = await this.prisma.$transaction([
      this.prisma.intercompanyAgreement.count({ where }),
      this.prisma.intercompanyAgreement.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: {
          providerCompany: { select: { id: true, name: true, role: true } },
          recipientCompany: { select: { id: true, name: true, role: true } },
        },
      }),
    ]);

    return {
      data: agreements.map((agreement) => ({
        id: agreement.id,
        provider_company_id: agreement.providerCompanyId,
        provider_company_name: agreement.providerCompany?.name ?? undefined,
        provider_company_role: agreement.providerCompany?.role ?? undefined,
        recipient_company_id: agreement.recipientCompanyId,
        recipient_company_name: agreement.recipientCompany?.name ?? undefined,
        recipient_company_role: agreement.recipientCompany?.role ?? undefined,
        type: agreement.type,
        pricing_model: agreement.pricingModel,
        markup_rate: agreement.markupRate ? agreement.markupRate.toString() : undefined,
        fixed_fee_amount: agreement.fixedFeeAmount ? agreement.fixedFeeAmount.toString() : undefined,
        vat_applies: agreement.vatApplies,
        vat_rate: agreement.vatRate.toString(),
        wht_applies: agreement.whtApplies,
        wht_rate: agreement.whtRate.toString(),
        wht_tax_type: agreement.whtTaxType ?? undefined,
        effective_from: agreement.effectiveFrom.toISOString(),
        effective_to: agreement.effectiveTo ? agreement.effectiveTo.toISOString() : undefined,
        created_at: agreement.createdAt.toISOString(),
      })),
      meta: {
        limit: query.limit ?? 50,
        offset: query.offset ?? 0,
        total,
      },
    };
  }

  async createAgreement(groupId: string, input: AgreementInput) {
    requireGroupId(groupId);
    await assertCompanyInGroup(this.prisma, groupId, input.providerCompanyId, "Provider company");
    await assertCompanyInGroup(this.prisma, groupId, input.recipientCompanyId, "Recipient company");

    const normalized = normalizeAgreementInput(input);
    validateAgreement(normalized);
    assertEffectiveWindow(normalized);

    const subsidiaries = await this.prisma.subsidiary.findMany({
      where: { id: { in: [normalized.providerCompanyId, normalized.recipientCompanyId] } },
      select: { id: true, name: true, role: true },
    });
    const provider = subsidiaries.find((s) => s.id === normalized.providerCompanyId);
    const recipient = subsidiaries.find((s) => s.id === normalized.recipientCompanyId);

    if (!provider || !recipient) {
      throw new BadRequestException("Provider or recipient subsidiary not found");
    }
    if (provider.id === recipient.id) {
      throw new BadRequestException("Provider and recipient must be different subsidiaries");
    }

    assertAgreementRoles(provider, recipient, normalized.type);

    return this.prisma.intercompanyAgreement.create({
      data: {
        providerCompanyId: normalized.providerCompanyId,
        recipientCompanyId: normalized.recipientCompanyId,
        type: normalized.type,
        pricingModel: normalized.pricingModel,
        markupRate: normalized.markupRate ?? null,
        fixedFeeAmount: normalized.fixedFeeAmount ?? null,
        vatApplies: normalized.vatApplies,
        vatRate: normalized.vatRate ?? 0,
        whtApplies: normalized.whtApplies,
        whtRate: normalized.whtRate ?? 0,
        whtTaxType: normalized.whtTaxType ?? null,
        effectiveFrom: normalized.effectiveFrom,
        effectiveTo: normalized.effectiveTo ?? null,
      },
    });
  }

  async updateAgreement(groupId: string, id: string, input: Partial<AgreementInput>) {
    requireGroupId(groupId);
    if (!id) throw new BadRequestException("Agreement id is required");

    const existing = await this.prisma.intercompanyAgreement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Intercompany agreement not found");

    const merged: AgreementInput = normalizeAgreementInput({
      providerCompanyId: input.providerCompanyId ?? existing.providerCompanyId,
      recipientCompanyId: input.recipientCompanyId ?? existing.recipientCompanyId,
      type: (input.type ?? existing.type) as AgreementType,
      pricingModel: (input.pricingModel ?? existing.pricingModel) as PricingModel,
      markupRate: input.markupRate ?? existing.markupRate,
      fixedFeeAmount: input.fixedFeeAmount ?? existing.fixedFeeAmount,
      vatApplies: input.vatApplies ?? existing.vatApplies,
      vatRate: input.vatRate ?? existing.vatRate,
      whtApplies: input.whtApplies ?? existing.whtApplies,
      whtRate: input.whtRate ?? existing.whtRate,
      whtTaxType: input.whtTaxType ?? existing.whtTaxType,
      effectiveFrom: input.effectiveFrom ?? existing.effectiveFrom,
      effectiveTo: input.effectiveTo ?? existing.effectiveTo,
    });

    await assertCompanyInGroup(this.prisma, groupId, merged.providerCompanyId, "Provider company");
    await assertCompanyInGroup(this.prisma, groupId, merged.recipientCompanyId, "Recipient company");

    validateAgreement(merged);
    assertEffectiveWindow(merged, existing);

    const subsidiaries = await this.prisma.subsidiary.findMany({
      where: { id: { in: [merged.providerCompanyId, merged.recipientCompanyId] } },
      select: { id: true, name: true, role: true },
    });
    const provider = subsidiaries.find((s) => s.id === merged.providerCompanyId);
    const recipient = subsidiaries.find((s) => s.id === merged.recipientCompanyId);

    if (!provider || !recipient) {
      throw new BadRequestException("Provider or recipient subsidiary not found");
    }
    if (provider.id === recipient.id) {
      throw new BadRequestException("Provider and recipient must be different subsidiaries");
    }

    assertAgreementRoles(provider, recipient, merged.type);

    return this.prisma.intercompanyAgreement.update({
      where: { id },
      data: {
        providerCompanyId: merged.providerCompanyId,
        recipientCompanyId: merged.recipientCompanyId,
        type: merged.type,
        pricingModel: merged.pricingModel,
        markupRate: merged.markupRate ?? null,
        fixedFeeAmount: merged.fixedFeeAmount ?? null,
        vatApplies: merged.vatApplies,
        vatRate: merged.vatRate ?? 0,
        whtApplies: merged.whtApplies,
        whtRate: merged.whtRate ?? 0,
        whtTaxType: merged.whtTaxType ?? null,
        effectiveFrom: merged.effectiveFrom,
        effectiveTo: merged.effectiveTo ?? null,
      },
    });
  }
}
