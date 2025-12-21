import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";

type CustomerRow = {
  name?: string;
  phone?: string;
  email?: string;
  status?: string;
};

function getExternalId(row: CustomerRow): string | undefined {
  const email = normalize(row.email);
  if (email) return email.toLowerCase();
  const phone = normalize(row.phone);
  return phone || undefined;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for customers import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<CustomerRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = normalize(row.name);
    const externalId = getExternalId(row);
    if (!externalId) {
      skipped += 1;
      continue;
    }

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "customer",
      externalId,
    });

    const status = normalize(row.status) || "active";

    let customerId: string;

    if (existingMap) {
      const updatedCustomer = await prisma.customer.update({
        where: { id: existingMap.entityId },
        data: {
          name: name || undefined,
          email: normalize(row.email) || undefined,
          phone: normalize(row.phone) || undefined,
          status,
        },
      });
      customerId = updatedCustomer.id;
      updated += 1;
    } else {
      const existingCustomer = await prisma.customer.findFirst({
        where: {
          groupId: config.groupId,
          OR: [
            normalize(row.email) ? { email: normalize(row.email) } : undefined,
            normalize(row.phone) ? { phone: normalize(row.phone) } : undefined,
          ].filter(Boolean) as Array<{ email?: string; phone?: string }>,
        },
      });

      if (existingCustomer) {
        const updatedCustomer = await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: name || existingCustomer.name,
            email: normalize(row.email) || existingCustomer.email,
            phone: normalize(row.phone) || existingCustomer.phone,
            status,
          },
        });
        customerId = updatedCustomer.id;
        updated += 1;
      } else {
        const createdCustomer = await prisma.customer.create({
          data: {
            groupId: config.groupId,
            name: name || "Customer",
            email: normalize(row.email) || undefined,
            phone: normalize(row.phone) || undefined,
            status,
          },
        });
        customerId = createdCustomer.id;
        created += 1;
      }
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "customer",
      externalId,
      entityId: customerId,
    });
  }

  console.log(`Customers import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
