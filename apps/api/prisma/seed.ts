import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function formatPeriod(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

function startOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

function endOfMonthUtc(date: Date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0));
}

async function main() {
  const existingGroup = await prisma.tenantGroup.findFirst({
    orderBy: { createdAt: "asc" },
  });

  const group = existingGroup
    ? await prisma.tenantGroup.update({
        where: { id: existingGroup.id },
        data: { name: "Alims Group Limited" },
      })
    : await prisma.tenantGroup.create({
        data: { name: "Alims Group Limited" },
      });

  const tenancyPermissions = ["tenancy.read", "tenancy.users.read"];
  const catalogPermissions = [
    "catalog.brand.read",
    "catalog.brand.write",
    "catalog.supplier.read",
    "catalog.supplier.write",
    "catalog.product.read",
    "catalog.product.write",
    "catalog.variant.read",
    "catalog.variant.write",
  ];
  const inventoryPermissions = [
    "inventory.stock.read",
    "inventory.stock.adjust",
    "inventory.stock.transfer",
    "inventory.stock.reserve",
  ];
  const pricingPermissions = [
    "pricing.price_list.read",
    "pricing.price_list.write",
    "pricing.price_rule.read",
    "pricing.price_rule.write",
    "pricing.promotion.read",
    "pricing.promotion.write",
  ];
  const ordersPermissions = ["orders.read", "orders.write", "orders.cancel", "orders.fulfill"];
  const paymentsPermissions = ["payments.intent.create", "payments.capture", "payments.refund"];
  const creditPermissions = [
    "credit.reseller.read",
    "credit.reseller.write",
    "credit.account.read",
    "credit.account.write",
    "credit.limit.write",
    "credit.repayment.write",
  ];
  const loyaltyPermissions = [
    "loyalty.customer.read",
    "loyalty.customer.write",
    "loyalty.account.read",
    "loyalty.account.write",
    "loyalty.points.issue",
  ];
  const logisticsPermissions = ["logistics.shipment.read", "logistics.shipment.write"];
  const reportsPermissions = ["reports.sales", "reports.inventory", "reports.credit"];
  const sharedServicesPermissions = [
    "shared_services.third_party.read",
    "shared_services.third_party.write",
    "shared_services.request.create",
    "shared_services.request.read",
    "shared_services.request.assign",
    "shared_services.request.approve",
    "shared_services.request.reject",
    "shared_services.request.start",
    "shared_services.request.complete",
    "shared_services.request.cancel",
  ];
  const hrPermissions = [
    "hr.department.manage",
    "hr.position.manage",
    "hr.employee.manage",
    "hr.leave.manage",
  ];
  const financePermissions = [
    "finance.chart_of_accounts.manage",
    "finance.cost_centers.manage",
    "finance.fiscal_periods.manage",
    "finance.journal_entries.manage",
    "finance.month_close.run",
    "finance.cost_pools.manage",
    "finance.intercompany.generate",
    "finance.invoices.issue",
    "finance.ledger.post",
    "finance.payments.record",
    "finance.wht.schedule.read",
    "finance.wht.remit",
    "finance.vat.generate",
    "finance.vat.file",
    "finance.period_lock.manage",
    "finance.credit_notes.manage",
    "finance.tax_impact.read",
    "finance.consolidated_pl.read",
  ];
  const compliancePermissions = [
    "compliance.policy.manage",
    "compliance.task.manage",
    "compliance.audit.manage",
    "compliance.risk.manage",
  ];
  const procurementPermissions = ["procurement.request.manage", "procurement.order.manage"];
  const advisoryPermissions = ["advisory.engagement.manage", "advisory.deliverable.manage"];
  const rbacPermissions = ["rbac.roles.manage", "rbac.permissions.read"];

  const permissionCodes = Array.from(new Set([
    ...tenancyPermissions,
    ...catalogPermissions,
    ...inventoryPermissions,
    ...pricingPermissions,
    ...ordersPermissions,
    ...paymentsPermissions,
    ...creditPermissions,
    ...loyaltyPermissions,
    ...logisticsPermissions,
    ...reportsPermissions,
    ...sharedServicesPermissions,
    ...hrPermissions,
    ...financePermissions,
    ...compliancePermissions,
    ...procurementPermissions,
    ...advisoryPermissions,
    ...rbacPermissions,
  ]));

  const permissions = await Promise.all(
    permissionCodes.map((code) =>
      prisma.permission.upsert({
        where: { code },
        update: {},
        create: { code },
      }),
    ),
  );

  const permissionByCode = new Map(permissions.map((permission) => [permission.code, permission.id]));
  const allPermissionIds = permissions.map((permission) => permission.id);

  const rolePresets = [
    { name: "Group Admin", scope: "group", permissions: ["*"] },
    { name: "Shared Services Manager", scope: "group", permissions: [...sharedServicesPermissions, ...hrPermissions, ...compliancePermissions] },
    { name: "Shared Services Agent", scope: "group", permissions: ["shared_services.request.read", "shared_services.request.create", "shared_services.request.start", "shared_services.request.complete"] },
    { name: "Subsidiary Requester", scope: "subsidiary", permissions: ["shared_services.request.read", "shared_services.request.create"] },
    { name: "Finance Admin", scope: "group", permissions: [...financePermissions, "shared_services.request.read"] },
    { name: "HR Manager", scope: "group", permissions: [...hrPermissions, "shared_services.request.read"] },
    { name: "Compliance Officer", scope: "group", permissions: [...compliancePermissions, "shared_services.request.read", "shared_services.request.approve", "shared_services.request.reject"] },
    { name: "Procurement Manager", scope: "group", permissions: [...procurementPermissions, "shared_services.request.read", "shared_services.request.approve", "shared_services.request.reject"] },
    { name: "Advisory Lead", scope: "group", permissions: [...advisoryPermissions, "shared_services.request.read"] },
    { name: "Auditor", scope: "group", permissions: ["finance.tax_impact.read", "finance.consolidated_pl.read"] },
    { name: "RBAC Admin", scope: "group", permissions: [...rbacPermissions] },
  ];

  for (const preset of rolePresets) {
    const permissionIds = preset.permissions.includes("*")
      ? allPermissionIds
      : preset.permissions.map((code) => {
          const id = permissionByCode.get(code);
          if (!id) {
            throw new Error(`Missing permission for role seed: ${code}`);
          }
          return id;
        });

    const existingRole = await prisma.role.findFirst({
      where: { groupId: group.id, name: preset.name },
    });

    if (existingRole) {
      await prisma.role.update({
        where: { id: existingRole.id },
        data: { scope: preset.scope },
      });
      await prisma.rolePermission.deleteMany({ where: { roleId: existingRole.id } });
      if (permissionIds.length) {
        await prisma.rolePermission.createMany({
          data: permissionIds.map((permissionId) => ({ roleId: existingRole.id, permissionId })),
        });
      }
    } else {
      await prisma.role.create({
        data: {
          groupId: group.id,
          name: preset.name,
          scope: preset.scope,
          rolePermissions: {
            create: permissionIds.map((permissionId) => ({ permissionId })),
          },
        },
      });
    }
  }

  const holdingCompanyName = "Alims Group Limited";
  const subsidiaryNames = [
    "Alims Perfume Trading Limited",
    "Alims Retail Stores Limited",
    "Alims Reseller Network Limited",
    "Alims Digital Commerce Limited",
    "Alims Logistics & Distribution Limited",
  ];

  const holdingCompany = await prisma.subsidiary.upsert({
    where: { groupId_name: { groupId: group.id, name: holdingCompanyName } },
    update: { status: "active" },
    create: { groupId: group.id, name: holdingCompanyName, status: "active" },
  });

  const recipientSubsidiaries = await Promise.all(
    subsidiaryNames.map((name) =>
      prisma.subsidiary.upsert({
        where: { groupId_name: { groupId: group.id, name } },
        update: { status: "active" },
        create: { groupId: group.id, name, status: "active" },
      }),
    ),
  );

  const providerCompany = holdingCompany;

  const chartAccounts = [
    { code: "1000", name: "Cash", type: "asset" },
    { code: "1100", name: "Accounts Receivable", type: "asset" },
    { code: "2000", name: "Accounts Payable", type: "liability" },
    { code: "3000", name: "Retained Earnings", type: "equity" },
    { code: "4000", name: "Sales Revenue", type: "income" },
    { code: "5000", name: "Cost of Goods Sold", type: "expense" },
    { code: "6000", name: "Operating Expenses", type: "expense" },
  ];

  for (const account of chartAccounts) {
    await prisma.chartOfAccount.upsert({
      where: { groupId_code: { groupId: group.id, code: account.code } },
      update: { name: account.name, type: account.type, parentId: null },
      create: {
        groupId: group.id,
        code: account.code,
        name: account.name,
        type: account.type,
      },
    });
  }

  const costCenters = [
    { code: "OPS", name: "Operations", subsidiaryId: providerCompany.id },
    { code: "ADM", name: "Administration", subsidiaryId: providerCompany.id },
  ];

  for (const center of costCenters) {
    await prisma.costCenter.upsert({
      where: { groupId_code: { groupId: group.id, code: center.code } },
      update: { name: center.name, subsidiaryId: center.subsidiaryId },
      create: {
        groupId: group.id,
        subsidiaryId: center.subsidiaryId,
        code: center.code,
        name: center.name,
      },
    });
  }

  const ledgerAccounts = [
    { code: "REV_SALES", name: "Sales Revenue", type: "REVENUE" },
    { code: "IC_REV", name: "Intercompany Revenue", type: "REVENUE" },
    { code: "IC_EXP", name: "Intercompany Expense", type: "EXPENSE" },
  ];

  for (const company of [providerCompany, ...recipientSubsidiaries]) {
    for (const account of ledgerAccounts) {
      await prisma.ledgerAccount.upsert({
        where: { companyId_code: { companyId: company.id, code: account.code } },
        update: { name: account.name, type: account.type },
        create: {
          companyId: company.id,
          code: account.code,
          name: account.name,
          type: account.type,
        },
      });
    }
  }

  const now = new Date();
  const periodName = formatPeriod(now);
  const startDate = startOfMonthUtc(now);
  const endDate = endOfMonthUtc(now);

  const existingPeriod = await prisma.fiscalPeriod.findFirst({
    where: { groupId: group.id, name: periodName },
  });

  if (!existingPeriod) {
    await prisma.fiscalPeriod.create({
      data: {
        groupId: group.id,
        name: periodName,
        startDate,
        endDate,
        status: "open",
      },
    });
  }

  if (providerCompany) {
    const effectiveFrom = new Date(Date.UTC(now.getUTCFullYear(), 0, 1));

    for (const recipient of recipientSubsidiaries) {
      const managementAgreement = await prisma.intercompanyAgreement.findFirst({
        where: {
          providerCompanyId: providerCompany.id,
          recipientCompanyId: recipient.id,
          type: "MANAGEMENT",
          pricingModel: "COST_PLUS",
        },
      });

      if (!managementAgreement) {
        await prisma.intercompanyAgreement.create({
          data: {
            providerCompanyId: providerCompany.id,
            recipientCompanyId: recipient.id,
            type: "MANAGEMENT",
            pricingModel: "COST_PLUS",
            markupRate: "0.1000",
            vatApplies: true,
            vatRate: "0.0750",
            whtApplies: true,
            whtRate: "0.0500",
            whtTaxType: "SERVICES",
            effectiveFrom,
          },
        });
      }

      const ipAgreement = await prisma.intercompanyAgreement.findFirst({
        where: {
          providerCompanyId: providerCompany.id,
          recipientCompanyId: recipient.id,
          type: "IP_LICENSE",
          pricingModel: "FIXED_MONTHLY",
        },
      });

      if (!ipAgreement) {
        await prisma.intercompanyAgreement.create({
          data: {
            providerCompanyId: providerCompany.id,
            recipientCompanyId: recipient.id,
            type: "IP_LICENSE",
            pricingModel: "FIXED_MONTHLY",
            fixedFeeAmount: "50000.00",
            vatApplies: true,
            vatRate: "0.0750",
            whtApplies: true,
            whtRate: "0.1000",
            whtTaxType: "ROYALTIES",
            effectiveFrom,
          },
        });
      }
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
