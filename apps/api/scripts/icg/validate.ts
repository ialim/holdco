import { existsSync } from "fs";
import { join } from "path";
import { PrismaClient } from "@prisma/client";
import { parseArgs } from "./lib/args";
import { loadConfig } from "./lib/config";
import { normalize, parseCsv, parseDecimal, parseIntSafe } from "./lib/csv";
import { loadStoreLocationMap } from "./lib/store-location-map";

type InventoryRow = {
  store_id?: string;
  qty?: string;
};

type OrderRow = {
  total_amount?: string;
};

function toNumber(value: string | undefined): number {
  if (!value) return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

async function run() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.dirPath) throw new Error("Missing --dir for validation");

  const config = loadConfig(args.configPath);
  const prisma = new PrismaClient();

  const dir = args.dirPath;
  const files = {
    brands: "brands.csv",
    products: "products.csv",
    variants: "variants.csv",
    priceLists: "price_lists.csv",
    priceRules: "price_rules.csv",
    customers: "customers.csv",
    inventory: "inventory.csv",
    orders: "orders.csv",
    orderItems: "order_items.csv",
    payments: "payments.csv",
  };

  const counts: Record<string, number> = {};
  for (const [key, file] of Object.entries(files)) {
    const path = join(dir, file);
    if (!existsSync(path)) continue;
    counts[key] = parseCsv(path).length;
  }

  const dbCounts = {
    brands: await prisma.brand.count({ where: { groupId: config.groupId } }),
    products: await prisma.product.count({ where: { groupId: config.groupId } }),
    variants: await prisma.variant.count({ where: { groupId: config.groupId } }),
    priceLists: await prisma.priceList.count({ where: { groupId: config.groupId } }),
    priceRules: await prisma.priceRule.count({ where: { groupId: config.groupId } }),
    customers: await prisma.customer.count({ where: { groupId: config.groupId } }),
    orders: await prisma.order.count({ where: { groupId: config.groupId } }),
    orderItems: await prisma.orderItem.count({
      where: { order: { groupId: config.groupId } },
    }),
    payments: await prisma.paymentIntent.count({
      where: { groupId: config.groupId },
    }),
  };

  console.log("Row count validation:");
  for (const key of Object.keys(dbCounts)) {
    const inputCount = counts[key] ?? 0;
    const dbCount = (dbCounts as Record<string, number>)[key];
    console.log(`- ${key}: input=${inputCount} db=${dbCount}`);
  }

  const ordersPath = join(dir, files.orders);
  if (existsSync(ordersPath)) {
    const orderRows = parseCsv<OrderRow>(ordersPath);
    const inputTotal = orderRows.reduce((sum, row) => sum + toNumber(parseDecimal(row.total_amount)), 0);
    const dbTotal = await prisma.order.aggregate({
      where: { groupId: config.groupId },
      _sum: { totalAmount: true },
    });
    const dbSum = Number(dbTotal._sum.totalAmount ?? 0);
    console.log(`Order totals: input=${inputTotal.toFixed(2)} db=${dbSum.toFixed(2)}`);
  }

  const inventoryPath = join(dir, files.inventory);
  if (existsSync(inventoryPath) && config.storeLocationMapFile) {
    const storeMap = loadStoreLocationMap(config.storeLocationMapFile);
    const inventoryRows = parseCsv<InventoryRow>(inventoryPath);
    const inputTotals = new Map<string, number>();
    for (const row of inventoryRows) {
      const storeId = normalize(row.store_id);
      if (!storeId) continue;
      const qty = parseIntSafe(row.qty) ?? 0;
      inputTotals.set(storeId, (inputTotals.get(storeId) ?? 0) + qty);
    }

    console.log("Inventory totals by store:");
    for (const [storeId, total] of inputTotals.entries()) {
      const mapping = storeMap.get(storeId);
      if (!mapping) {
        console.log(`- store ${storeId}: input=${total} db=missing mapping`);
        continue;
      }
      const dbRows = await prisma.stockLevel.findMany({
        where: { groupId: config.groupId, locationId: mapping.locationId },
        select: { onHand: true },
      });
      const dbTotal = dbRows.reduce((sum, row) => sum + Number(row.onHand), 0);
      console.log(`- store ${storeId}: input=${total} db=${dbTotal}`);
    }
  }

  await prisma.$disconnect();
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
