import { PrismaClient, SubsidiaryRole } from "@prisma/client";
import { randomBytes, scryptSync } from "crypto";

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

function hashPin(pin: string) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(pin, salt, 64);
  return `scrypt$${salt}$${derived.toString("hex")}`;
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

  const tenancyPermissions = [
    "tenancy.read",
    "tenancy.users.read",
    "tenancy.locations.read",
    "tenancy.locations.manage",
    "tenancy.subsidiaries.manage",
  ];
  const catalogPermissions = [
    "catalog.brand.read",
    "catalog.brand.write",
    "catalog.supplier.read",
    "catalog.supplier.write",
    "catalog.category.read",
    "catalog.category.write",
    "catalog.product.read",
    "catalog.product.write",
    "catalog.variant.read",
    "catalog.variant.write",
    "catalog.facet.read",
    "catalog.facet.write",
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
  const posPermissions = [
    "pos.devices.read",
    "pos.devices.manage",
    "pos.cashiers.manage",
    "pos.shifts.read",
    "pos.shifts.manage",
    "tenancy.locations.read",
    "catalog.category.read",
    "catalog.product.read",
    "catalog.variant.read",
    "pricing.price_list.read",
    "pricing.price_rule.read",
  ];
  const paymentsPermissions = ["payments.intent.create", "payments.capture", "payments.refund", "payments.reconcile", "payments.config.manage"];
  const creditPermissions = [
    "credit.reseller.read",
    "credit.reseller.write",
    "credit.account.read",
    "credit.account.write",
    "credit.limit.write",
    "credit.repayment.write",
  ];
  const creditOverridePermission = "credit.limit.override";
  const loyaltyPermissions = [
    "loyalty.customer.read",
    "loyalty.customer.write",
    "loyalty.account.read",
    "loyalty.account.write",
    "loyalty.points.issue",
  ];
  const logisticsPermissions = ["logistics.shipment.read", "logistics.shipment.write"];
  const reportsPermissions = ["reports.sales", "reports.inventory", "reports.credit"];
  const auditPermissions = ["audit.logs.read"];
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
    "finance.exports.read",
  ];
  const compliancePermissions = [
    "compliance.policy.manage",
    "compliance.task.manage",
    "compliance.audit.manage",
    "compliance.risk.manage",
  ];
  const procurementPermissions = [
    "procurement.request.manage",
    "procurement.order.manage",
    "procurement.imports.manage",
    "tenancy.locations.read",
  ];
  const advisoryPermissions = ["advisory.engagement.manage", "advisory.deliverable.manage"];
  const rbacPermissions = ["rbac.roles.manage", "rbac.permissions.read"];

  const permissionCodes = Array.from(new Set([
    ...tenancyPermissions,
    ...catalogPermissions,
    ...inventoryPermissions,
    ...pricingPermissions,
    ...ordersPermissions,
    ...posPermissions,
    ...paymentsPermissions,
    ...creditPermissions,
    creditOverridePermission,
    ...loyaltyPermissions,
    ...logisticsPermissions,
    ...reportsPermissions,
    ...auditPermissions,
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
    { name: "Wholesale Operator", scope: "subsidiary", permissions: ["orders.read", "orders.write", "orders.fulfill"] },
    {
      name: "Retail POS Operator",
      scope: "subsidiary",
      permissions: [
        "catalog.product.read",
        "catalog.variant.read",
        "pricing.price_list.read",
        "pricing.price_rule.read",
        "orders.write",
        "payments.intent.create",
        "payments.capture",
        "inventory.stock.reserve",
        "loyalty.points.issue",
        "pos.shifts.read",
        "pos.shifts.manage",
        "tenancy.locations.read",
      ],
    },
    { name: "POS Manager", scope: "subsidiary", permissions: [...posPermissions] },
    { name: "Digital Commerce Operator", scope: "subsidiary", permissions: ["orders.write", "payments.intent.create", "payments.capture"] },
    {
      name: "Reseller Credit Manager",
      scope: "subsidiary",
      permissions: [
        "credit.reseller.read",
        "credit.reseller.write",
        "credit.account.read",
        "credit.account.write",
        "credit.limit.write",
        "credit.limit.override",
        "credit.repayment.write",
      ],
    },
    { name: "Finance Admin", scope: "group", permissions: [...financePermissions, "shared_services.request.read"] },
    { name: "HR Manager", scope: "group", permissions: [...hrPermissions, "shared_services.request.read"] },
    { name: "Compliance Officer", scope: "group", permissions: [...compliancePermissions, "shared_services.request.read", "shared_services.request.approve", "shared_services.request.reject"] },
    { name: "Procurement Manager", scope: "group", permissions: [...procurementPermissions, "shared_services.request.read", "shared_services.request.approve", "shared_services.request.reject"] },
    { name: "Advisory Lead", scope: "group", permissions: [...advisoryPermissions, "shared_services.request.read"] },
    {
      name: "Auditor",
      scope: "group",
      permissions: ["finance.tax_impact.read", "finance.consolidated_pl.read", "audit.logs.read"],
    },
    {
      name: "RBAC Admin",
      scope: "group",
      permissions: [...rbacPermissions, "tenancy.subsidiaries.manage", "tenancy.locations.manage", "audit.logs.read"],
    },
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
  const subsidiaryRoles: Record<string, SubsidiaryRole> = {
    "Alims Perfume Trading Limited": SubsidiaryRole.PROCUREMENT_TRADING,
    "Alims Retail Stores Limited": SubsidiaryRole.RETAIL,
    "Alims Reseller Network Limited": SubsidiaryRole.RESELLER,
    "Alims Digital Commerce Limited": SubsidiaryRole.DIGITAL_COMMERCE,
    "Alims Logistics & Distribution Limited": SubsidiaryRole.LOGISTICS,
  };
  const subsidiaryNames = Object.keys(subsidiaryRoles);

  const holdingCompany = await prisma.subsidiary.upsert({
    where: { groupId_name: { groupId: group.id, name: holdingCompanyName } },
    update: { status: "active", role: SubsidiaryRole.HOLDCO },
    create: { groupId: group.id, name: holdingCompanyName, status: "active", role: SubsidiaryRole.HOLDCO },
  });

  const recipientSubsidiaries = await Promise.all(
    subsidiaryNames.map((name) =>
      prisma.subsidiary.upsert({
        where: { groupId_name: { groupId: group.id, name } },
        update: { status: "active", role: subsidiaryRoles[name] },
        create: { groupId: group.id, name, status: "active", role: subsidiaryRoles[name] },
      }),
    ),
  );

  const retailSubsidiary = recipientSubsidiaries.find((subsidiary) => subsidiary.name === "Alims Retail Stores Limited");

  const providerCompany = holdingCompany;

  const defaultFacets = [
    { key: "brand", name: "Brand", scope: "product" },
    { key: "concentration", name: "Concentration", scope: "product" },
    { key: "sex", name: "Sex", scope: "product" },
    { key: "size", name: "Size", scope: "variant" },
    { key: "packaging", name: "Packaging", scope: "variant" },
  ];

  for (const facet of defaultFacets) {
    await prisma.facetDefinition.upsert({
      where: { groupId_key: { groupId: group.id, key: facet.key } },
      update: { name: facet.name, scope: facet.scope, dataType: "text", status: "active" },
      create: {
        groupId: group.id,
        key: facet.key,
        name: facet.name,
        scope: facet.scope,
        dataType: "text",
        status: "active",
      },
    });
  }

  type DefaultCategorySeed = {
    code: string;
    name: string;
    sortOrder: number;
    productFilters?: { all: { key: string; value: string }[] }[];
    variantFilters?: { all: { key: string; value: string }[] }[];
  };

  const defaultCategories: DefaultCategorySeed[] = [
    { code: "ALL", name: "All Products", sortOrder: 0 },
    {
      code: "MEN",
      name: "Men",
      sortOrder: 10,
      productFilters: [{ all: [{ key: "sex", value: "male" }] }],
    },
    {
      code: "WOMEN",
      name: "Women",
      sortOrder: 20,
      productFilters: [{ all: [{ key: "sex", value: "female" }] }],
    },
    {
      code: "UNISEX",
      name: "Unisex",
      sortOrder: 30,
      productFilters: [{ all: [{ key: "sex", value: "unisex" }] }],
    },
    {
      code: "GIFT_SETS",
      name: "Gift Sets",
      sortOrder: 40,
      variantFilters: [{ all: [{ key: "packaging", value: "gift_set" }] }],
    },
    {
      code: "TESTERS",
      name: "Testers",
      sortOrder: 50,
      variantFilters: [{ all: [{ key: "packaging", value: "tester" }] }],
    },
  ];

  for (const subsidiary of recipientSubsidiaries) {
    for (const category of defaultCategories) {
      const existingCategory = await prisma.category.findFirst({
        where: {
          subsidiaryId: subsidiary.id,
          code: category.code,
        },
      });
      if (existingCategory) continue;

      await prisma.category.create({
        data: {
          groupId: group.id,
          subsidiaryId: subsidiary.id,
          code: category.code,
          name: category.name,
          status: "active",
          sortOrder: category.sortOrder,
          productFilters: category.productFilters ?? undefined,
          variantFilters: category.variantFilters ?? undefined,
        },
      });
    }
  }

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
    { code: "TAX_CIT_EXP", name: "Income Tax Expense", type: "EXPENSE" },
    { code: "TAX_CIT_PAY", name: "Income Tax Payable", type: "LIABILITY" },
    { code: "TAX_EDU_EXP", name: "Education Tax Expense", type: "EXPENSE" },
    { code: "TAX_EDU_PAY", name: "Education Tax Payable", type: "LIABILITY" },
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
      const agreementSeeds = [
        {
          type: "MANAGEMENT",
          pricingModel: "COST_PLUS",
          markupRate: "0.1000",
          vatApplies: true,
          vatRate: "0.0750",
          whtApplies: true,
          whtRate: "0.0500",
          whtTaxType: "SERVICES",
        },
        {
          type: "PRODUCT_SUPPLY",
          pricingModel: "COST_PLUS",
          markupRate: "0.0500",
          vatApplies: true,
          vatRate: "0.0750",
          whtApplies: true,
          whtRate: "0.0500",
          whtTaxType: "GOODS",
        },
        {
          type: "LOGISTICS",
          pricingModel: "COST_PLUS",
          markupRate: "0.0800",
          vatApplies: true,
          vatRate: "0.0750",
          whtApplies: true,
          whtRate: "0.0500",
          whtTaxType: "SERVICES",
        },
        {
          type: "IP_LICENSE",
          pricingModel: "ROYALTY_PERCENT",
          markupRate: "0.0200",
          vatApplies: true,
          vatRate: "0.0750",
          whtApplies: true,
          whtRate: "0.1000",
          whtTaxType: "ROYALTIES",
        },
      ];

      for (const seed of agreementSeeds) {
        const existing = await prisma.intercompanyAgreement.findFirst({
          where: {
            providerCompanyId: providerCompany.id,
            recipientCompanyId: recipient.id,
            type: seed.type,
          },
        });

        const data = {
          providerCompanyId: providerCompany.id,
          recipientCompanyId: recipient.id,
          type: seed.type,
          pricingModel: seed.pricingModel,
          markupRate: seed.markupRate ?? null,
          fixedFeeAmount: null,
          vatApplies: seed.vatApplies,
          vatRate: seed.vatRate,
          whtApplies: seed.whtApplies,
          whtRate: seed.whtRate,
          whtTaxType: seed.whtTaxType,
          effectiveFrom,
          effectiveTo: null,
        };

        if (existing) {
          await prisma.intercompanyAgreement.update({
            where: { id: existing.id },
            data,
          });
        } else {
          await prisma.intercompanyAgreement.create({ data });
        }
      }
    }
  }

  if (retailSubsidiary) {
    const cashierEmail = "retail.cashier@alims.com";
    const cashierPin = "1234";
    const cashierUser = await prisma.user.upsert({
      where: { groupId_email: { groupId: group.id, email: cashierEmail } },
      update: { name: "Retail Cashier", status: "active", posPinHash: hashPin(cashierPin) },
      create: {
        groupId: group.id,
        email: cashierEmail,
        name: "Retail Cashier",
        status: "active",
        posPinHash: hashPin(cashierPin),
      },
    });

    await prisma.employee.upsert({
      where: { groupId_employeeNo: { groupId: group.id, employeeNo: "RET-001" } },
      update: {
        subsidiaryId: retailSubsidiary.id,
        userId: cashierUser.id,
        status: "active",
      },
      create: {
        groupId: group.id,
        subsidiaryId: retailSubsidiary.id,
        userId: cashierUser.id,
        employeeNo: "RET-001",
        status: "active",
        hiredAt: new Date(),
      },
    });

    const posRole = await prisma.role.findFirst({
      where: { groupId: group.id, name: "Retail POS Operator" },
    });
    if (posRole) {
      const existingUserRole = await prisma.userRole.findFirst({
        where: { userId: cashierUser.id, roleId: posRole.id, subsidiaryId: retailSubsidiary.id },
      });
      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId: cashierUser.id,
            roleId: posRole.id,
            subsidiaryId: retailSubsidiary.id,
          },
        });
      }
    }

    const managerEmail = "retail.manager@alims.com";
    const managerPin = "2468";
    const managerUser = await prisma.user.upsert({
      where: { groupId_email: { groupId: group.id, email: managerEmail } },
      update: { name: "Retail POS Manager", status: "active", posPinHash: hashPin(managerPin) },
      create: {
        groupId: group.id,
        email: managerEmail,
        name: "Retail POS Manager",
        status: "active",
        posPinHash: hashPin(managerPin),
      },
    });

    await prisma.employee.upsert({
      where: { groupId_employeeNo: { groupId: group.id, employeeNo: "MGR-001" } },
      update: {
        subsidiaryId: retailSubsidiary.id,
        userId: managerUser.id,
        status: "active",
      },
      create: {
        groupId: group.id,
        subsidiaryId: retailSubsidiary.id,
        userId: managerUser.id,
        employeeNo: "MGR-001",
        status: "active",
        hiredAt: new Date(),
      },
    });

    const managerRole = await prisma.role.findFirst({
      where: { groupId: group.id, name: "POS Manager" },
    });
    if (managerRole) {
      const existingManagerRole = await prisma.userRole.findFirst({
        where: { userId: managerUser.id, roleId: managerRole.id, subsidiaryId: retailSubsidiary.id },
      });
      if (!existingManagerRole) {
        await prisma.userRole.create({
          data: {
            userId: managerUser.id,
            roleId: managerRole.id,
            subsidiaryId: retailSubsidiary.id,
          },
        });
      }
    }
  }

  const paymentProviders = ["paystack", "flutterwave", "moniepoint"];
  const paymentEnvironments = ["test", "live"];
  for (const subsidiary of recipientSubsidiaries) {
    for (const provider of paymentProviders) {
      for (const environment of paymentEnvironments) {
        await prisma.paymentProviderConfig.upsert({
          where: {
            subsidiaryId_provider_environment: {
              subsidiaryId: subsidiary.id,
              provider,
              environment,
            },
          },
          update: { status: "draft" },
          create: {
            groupId: group.id,
            subsidiaryId: subsidiary.id,
            provider,
            environment,
            status: "draft",
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
