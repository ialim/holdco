import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, PaymentProviderConfig } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePaymentProviderConfigDto } from "./dto/create-payment-provider-config.dto";
import { UpdatePaymentProviderConfigDto } from "./dto/update-payment-provider-config.dto";
import { ListPaymentProviderConfigsDto } from "./dto/list-payment-provider-configs.dto";

@Injectable()
export class PaymentProviderConfigService {
  constructor(private readonly prisma: PrismaService) {}

  async listConfigs(groupId: string, query: ListPaymentProviderConfigsDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where: Prisma.PaymentProviderConfigWhereInput = {
      groupId,
      ...(query.subsidiary_id ? { subsidiaryId: query.subsidiary_id } : {}),
      ...(query.provider ? { provider: query.provider.toLowerCase() } : {}),
      ...(query.environment ? { environment: query.environment.toLowerCase() } : {}),
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, configs] = await this.prisma.$transaction([
      this.prisma.paymentProviderConfig.count({ where }),
      this.prisma.paymentProviderConfig.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: configs.map((config) => this.mapConfig(config)),
      meta: { limit: query.limit ?? 50, offset: query.offset ?? 0, total },
    };
  }

  async upsertConfig(groupId: string, body: CreatePaymentProviderConfigDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const subsidiary = await this.prisma.subsidiary.findFirst({
      where: { id: body.subsidiary_id, groupId },
      select: { id: true },
    });
    if (!subsidiary) throw new BadRequestException("Subsidiary not found for group");

    const provider = body.provider.toLowerCase();
    const environment = (body.environment ?? "test").toLowerCase();
    const status = body.status ?? "draft";

    const data: Prisma.PaymentProviderConfigUncheckedCreateInput = {
      groupId,
      subsidiaryId: body.subsidiary_id,
      provider,
      environment,
      status,
      settlementAccountName: body.settlement_account_name,
      settlementAccountNumber: body.settlement_account_number,
      settlementBankName: body.settlement_bank_name,
      settlementBankCode: body.settlement_bank_code,
      settlementCurrency: body.settlement_currency,
      contactName: body.contact_name,
      contactEmail: body.contact_email,
      contactPhone: body.contact_phone,
      providerMerchantId: body.provider_merchant_id,
      kycSubmittedAt: body.kyc_submitted_at ? new Date(body.kyc_submitted_at) : undefined,
      kycApprovedAt: body.kyc_approved_at ? new Date(body.kyc_approved_at) : undefined,
      kycNotes: body.kyc_notes,
    };

    this.applyStatusDates(status, data);

    const config = await this.prisma.paymentProviderConfig.upsert({
      where: { subsidiaryId_provider_environment: { subsidiaryId: body.subsidiary_id, provider, environment } },
      update: data,
      create: data,
    });

    return this.mapConfig(config);
  }

  async updateConfig(groupId: string, configId: string, body: UpdatePaymentProviderConfigDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!configId) throw new BadRequestException("Config id is required");

    const existing = await this.prisma.paymentProviderConfig.findFirst({
      where: { id: configId, groupId },
    });
    if (!existing) throw new NotFoundException("Payment provider config not found");

    const data: Prisma.PaymentProviderConfigUpdateInput = {};
    if (body.status !== undefined) data.status = body.status;
    if (body.settlement_account_name !== undefined) data.settlementAccountName = body.settlement_account_name;
    if (body.settlement_account_number !== undefined) data.settlementAccountNumber = body.settlement_account_number;
    if (body.settlement_bank_name !== undefined) data.settlementBankName = body.settlement_bank_name;
    if (body.settlement_bank_code !== undefined) data.settlementBankCode = body.settlement_bank_code;
    if (body.settlement_currency !== undefined) data.settlementCurrency = body.settlement_currency;
    if (body.contact_name !== undefined) data.contactName = body.contact_name;
    if (body.contact_email !== undefined) data.contactEmail = body.contact_email;
    if (body.contact_phone !== undefined) data.contactPhone = body.contact_phone;
    if (body.provider_merchant_id !== undefined) data.providerMerchantId = body.provider_merchant_id;
    if (body.kyc_submitted_at !== undefined) {
      data.kycSubmittedAt = body.kyc_submitted_at ? new Date(body.kyc_submitted_at) : null;
    }
    if (body.kyc_approved_at !== undefined) {
      data.kycApprovedAt = body.kyc_approved_at ? new Date(body.kyc_approved_at) : null;
    }
    if (body.kyc_notes !== undefined) data.kycNotes = body.kyc_notes;

    this.applyStatusDates(body.status ?? undefined, data);

    const updated = await this.prisma.paymentProviderConfig.update({
      where: { id: existing.id },
      data,
    });

    return this.mapConfig(updated);
  }

  private applyStatusDates(
    status: string | undefined,
    data: Prisma.PaymentProviderConfigUncheckedCreateInput | Prisma.PaymentProviderConfigUpdateInput,
  ) {
    if (!status) return;
    const now = new Date();
    if (status === "submitted" && !("kycSubmittedAt" in data && data.kycSubmittedAt)) {
      data.kycSubmittedAt = now;
    }
    if (status === "approved" && !("kycApprovedAt" in data && data.kycApprovedAt)) {
      data.kycApprovedAt = now;
    }
  }

  private mapConfig(config: PaymentProviderConfig) {
    return {
      id: config.id,
      subsidiary_id: config.subsidiaryId,
      provider: config.provider,
      environment: config.environment,
      status: config.status,
      settlement_account_name: config.settlementAccountName ?? undefined,
      settlement_account_number: config.settlementAccountNumber ?? undefined,
      settlement_bank_name: config.settlementBankName ?? undefined,
      settlement_bank_code: config.settlementBankCode ?? undefined,
      settlement_currency: config.settlementCurrency ?? undefined,
      contact_name: config.contactName ?? undefined,
      contact_email: config.contactEmail ?? undefined,
      contact_phone: config.contactPhone ?? undefined,
      provider_merchant_id: config.providerMerchantId ?? undefined,
      kyc_submitted_at: config.kycSubmittedAt ? config.kycSubmittedAt.toISOString() : undefined,
      kyc_approved_at: config.kycApprovedAt ? config.kycApprovedAt.toISOString() : undefined,
      kyc_notes: config.kycNotes ?? undefined,
      created_at: config.createdAt.toISOString(),
      updated_at: config.updatedAt.toISOString(),
    };
  }
}
