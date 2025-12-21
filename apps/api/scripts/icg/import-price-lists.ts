import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseDate } from "./lib/csv";
import { findExternalIdMap, getExternalSystemId, upsertExternalIdMap } from "./lib/external-ids";

type PriceListRow = {
  list_name?: string;
  currency?: string;
  channel?: string;
  valid_from?: string;
  valid_to?: string;
};

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.filePath) throw new Error("Missing --file for price lists import");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();
  const externalSystemId = await getExternalSystemId(prisma, config.externalSystemName ?? "ICG");

  const rows = parseCsv<PriceListRow>(args.filePath);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    const name = normalize(row.list_name);
    if (!name) {
      skipped += 1;
      continue;
    }

    const currency = normalize(row.currency) || config.defaultCurrency;
    const channel = normalize(row.channel) || config.channel;
    const validFrom = parseDate(row.valid_from);
    const validTo = parseDate(row.valid_to);

    if (args.dryRun) {
      continue;
    }

    const existingMap = await findExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "price_list",
      externalId: name,
    });

    let priceListId: string;

    if (existingMap) {
      const updatedPriceList = await prisma.priceList.update({
        where: { id: existingMap.entityId },
        data: {
          name,
          currency,
          channel,
          validFrom,
          validTo,
        },
      });
      priceListId = updatedPriceList.id;
      updated += 1;
    } else {
      const existingPriceList = await prisma.priceList.findFirst({
        where: { groupId: config.groupId, name },
      });
      if (existingPriceList) {
        const updatedPriceList = await prisma.priceList.update({
          where: { id: existingPriceList.id },
          data: {
            currency,
            channel,
            validFrom,
            validTo,
          },
        });
        priceListId = updatedPriceList.id;
        updated += 1;
      } else {
        const createdPriceList = await prisma.priceList.create({
          data: {
            groupId: config.groupId,
            name,
            currency,
            channel,
            validFrom,
            validTo,
          },
        });
        priceListId = createdPriceList.id;
        created += 1;
      }
    }

    await upsertExternalIdMap({
      prisma,
      externalSystemId,
      entityType: "price_list",
      externalId: name,
      entityId: priceListId,
    });
  }

  console.log(`Price lists import complete. created=${created} updated=${updated} skipped=${skipped}`);
  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
