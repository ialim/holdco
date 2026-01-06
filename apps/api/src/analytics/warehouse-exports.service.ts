import { BadRequestException, Injectable } from "@nestjs/common";
import { SubsidiaryRole } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type ExportValue = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportValue>;

type WarehouseExportQuery = {
  format?: string;
  start_date?: string;
  end_date?: string;
};

@Injectable()
export class WarehouseExportsService {
  constructor(private readonly prisma: PrismaService) {}

  async exportOrders(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId, subsidiaryId };
    if (dateRange) where.createdAt = dateRange;

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "order_id",
      "group_id",
      "subsidiary_id",
      "location_id",
      "channel",
      "order_no",
      "customer_id",
      "reseller_id",
      "status",
      "total_amount",
      "currency",
      "created_at",
      "updated_at",
    ];

    const rows: ExportRow[] = orders.map((order) => ({
      order_id: order.id,
      group_id: order.groupId,
      subsidiary_id: order.subsidiaryId,
      location_id: order.locationId ?? null,
      channel: order.channel ?? null,
      order_no: order.orderNo,
      customer_id: order.customerId ?? null,
      reseller_id: order.resellerId ?? null,
      status: order.status,
      total_amount: order.totalAmount.toString(),
      currency: order.currency,
      created_at: order.createdAt.toISOString(),
      updated_at: order.updatedAt.toISOString(),
    }));

    return this.buildExportResponse("orders", columns, rows, query.format);
  }

  async exportOrderItems(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = {
      order: { groupId, subsidiaryId },
    };
    if (dateRange) where.order.createdAt = dateRange;

    const items = await this.prisma.orderItem.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true,
            groupId: true,
            subsidiaryId: true,
            createdAt: true,
          },
        },
      },
      orderBy: { orderId: "asc" },
    });

    const columns = [
      "order_item_id",
      "order_id",
      "order_no",
      "group_id",
      "subsidiary_id",
      "product_id",
      "variant_id",
      "quantity",
      "unit_price",
      "total_price",
      "order_created_at",
    ];

    const rows: ExportRow[] = items.map((item) => ({
      order_item_id: item.id,
      order_id: item.orderId,
      order_no: item.order.orderNo,
      group_id: item.order.groupId,
      subsidiary_id: item.order.subsidiaryId,
      product_id: item.productId,
      variant_id: item.variantId ?? null,
      quantity: item.quantity,
      unit_price: item.unitPrice.toString(),
      total_price: item.totalPrice.toString(),
      order_created_at: item.order.createdAt.toISOString(),
    }));

    return this.buildExportResponse("order-items", columns, rows, query.format);
  }

  async exportPaymentIntents(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId, subsidiaryId };
    if (dateRange) where.createdAt = dateRange;

    const intents = await this.prisma.paymentIntent.findMany({
      where,
      include: {
        order: {
          select: {
            orderNo: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "payment_intent_id",
      "order_id",
      "order_no",
      "group_id",
      "subsidiary_id",
      "amount",
      "currency",
      "status",
      "provider",
      "reference",
      "created_at",
    ];

    const rows: ExportRow[] = intents.map((intent) => ({
      payment_intent_id: intent.id,
      order_id: intent.orderId,
      order_no: intent.order?.orderNo ?? null,
      group_id: intent.groupId,
      subsidiary_id: intent.subsidiaryId,
      amount: intent.amount.toString(),
      currency: intent.currency,
      status: intent.status,
      provider: intent.provider ?? null,
      reference: intent.reference ?? null,
      created_at: intent.createdAt.toISOString(),
    }));

    return this.buildExportResponse("payment-intents", columns, rows, query.format);
  }

  async exportProducts(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId };
    if (this.isTradingSubsidiary(subsidiary)) {
      where.OR = [{ subsidiaryId }, { subsidiaryId: null }];
    } else {
      where.variants = { some: { assortments: { some: { subsidiaryId, status: "active" } } } };
    }
    if (dateRange) where.updatedAt = dateRange;

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "product_id",
      "group_id",
      "subsidiary_id",
      "brand_id",
      "supplier_id",
      "sku",
      "name",
      "type",
      "sex",
      "concentration",
      "status",
      "created_at",
      "updated_at",
    ];

    const rows: ExportRow[] = products.map((product) => ({
      product_id: product.id,
      group_id: product.groupId,
      subsidiary_id: product.subsidiaryId ?? null,
      brand_id: product.brandId ?? null,
      supplier_id: product.supplierId ?? null,
      sku: product.sku,
      name: product.name,
      type: product.type ?? null,
      sex: product.sex ?? null,
      concentration: product.concentration ?? null,
      status: product.status,
      created_at: product.createdAt.toISOString(),
      updated_at: product.updatedAt.toISOString(),
    }));

    return this.buildExportResponse("products", columns, rows, query.format);
  }

  async exportVariants(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const subsidiary = await this.getSubsidiary(groupId, subsidiaryId);
    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId };
    if (this.isTradingSubsidiary(subsidiary)) {
      where.OR = [{ subsidiaryId }, { subsidiaryId: null }];
    } else {
      where.assortments = { some: { subsidiaryId, status: "active" } };
    }
    if (dateRange) where.createdAt = dateRange;

    const variants = await this.prisma.variant.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "variant_id",
      "group_id",
      "subsidiary_id",
      "product_id",
      "size",
      "unit",
      "barcode",
      "created_at",
    ];

    const rows: ExportRow[] = variants.map((variant) => ({
      variant_id: variant.id,
      group_id: variant.groupId,
      subsidiary_id: variant.subsidiaryId ?? null,
      product_id: variant.productId,
      size: variant.size ?? null,
      unit: variant.unit ?? null,
      barcode: variant.barcode ?? null,
      created_at: variant.createdAt.toISOString(),
    }));

    return this.buildExportResponse("variants", columns, rows, query.format);
  }

  async exportCustomers(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId, subsidiaryId };
    if (dateRange) where.createdAt = dateRange;

    const customers = await this.prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "customer_id",
      "group_id",
      "subsidiary_id",
      "name",
      "email",
      "phone",
      "status",
      "created_at",
    ];

    const rows: ExportRow[] = customers.map((customer) => ({
      customer_id: customer.id,
      group_id: customer.groupId,
      subsidiary_id: customer.subsidiaryId ?? null,
      name: customer.name,
      email: customer.email ?? null,
      phone: customer.phone ?? null,
      status: customer.status,
      created_at: customer.createdAt.toISOString(),
    }));

    return this.buildExportResponse("customers", columns, rows, query.format);
  }

  async exportStockLevels(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId, subsidiaryId };
    if (dateRange) where.updatedAt = dateRange;

    const levels = await this.prisma.stockLevel.findMany({
      where,
      orderBy: { updatedAt: "desc" },
    });

    const columns = [
      "stock_level_id",
      "group_id",
      "subsidiary_id",
      "location_id",
      "product_id",
      "variant_id",
      "on_hand",
      "reserved",
      "updated_at",
    ];

    const rows: ExportRow[] = levels.map((level) => ({
      stock_level_id: level.id,
      group_id: level.groupId,
      subsidiary_id: level.subsidiaryId,
      location_id: level.locationId,
      product_id: level.productId,
      variant_id: level.variantId ?? null,
      on_hand: level.onHand,
      reserved: level.reserved,
      updated_at: level.updatedAt.toISOString(),
    }));

    return this.buildExportResponse("stock-levels", columns, rows, query.format);
  }

  async exportLocations(groupId: string, subsidiaryId: string, query: WarehouseExportQuery) {
    this.requireHeaders(groupId, subsidiaryId);

    const dateRange = this.parseDateRange(query);
    const where: Record<string, any> = { groupId, subsidiaryId };
    if (dateRange) where.updatedAt = dateRange;

    const locations = await this.prisma.location.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const columns = [
      "location_id",
      "group_id",
      "subsidiary_id",
      "type",
      "name",
      "address_line1",
      "address_line2",
      "city",
      "state",
      "country",
      "created_at",
      "updated_at",
    ];

    const rows: ExportRow[] = locations.map((location) => ({
      location_id: location.id,
      group_id: location.groupId,
      subsidiary_id: location.subsidiaryId,
      type: location.type,
      name: location.name,
      address_line1: location.addressLine1 ?? null,
      address_line2: location.addressLine2 ?? null,
      city: location.city ?? null,
      state: location.state ?? null,
      country: location.country ?? null,
      created_at: location.createdAt.toISOString(),
      updated_at: location.updatedAt.toISOString(),
    }));

    return this.buildExportResponse("locations", columns, rows, query.format);
  }

  private async getSubsidiary(groupId: string, subsidiaryId: string) {
    const subsidiary = await this.prisma.subsidiary.findFirst({
      where: { id: subsidiaryId, groupId },
      select: { id: true, role: true },
    });
    if (!subsidiary) throw new BadRequestException("Subsidiary not found");
    return subsidiary;
  }

  private isTradingSubsidiary(subsidiary: { role: SubsidiaryRole | null }) {
    return subsidiary.role === SubsidiaryRole.PROCUREMENT_TRADING;
  }

  private requireHeaders(groupId: string, subsidiaryId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
  }

  private normalizeFormat(format?: string) {
    return format === "csv" ? "csv" : "json";
  }

  private parseDateRange(query: WarehouseExportQuery) {
    const range: { gte?: Date; lte?: Date } = {};

    if (query.start_date) range.gte = new Date(query.start_date);
    if (query.end_date) {
      const end = new Date(query.end_date);
      end.setHours(23, 59, 59, 999);
      range.lte = end;
    }

    if (range.gte && range.lte && range.gte > range.lte) {
      throw new BadRequestException("start_date must be before end_date");
    }

    return Object.keys(range).length ? range : undefined;
  }

  private buildExportResponse(filePrefix: string, columns: string[], rows: ExportRow[], format?: string) {
    const resolvedFormat = this.normalizeFormat(format);
    const generatedAt = new Date().toISOString();
    const response: Record<string, any> = {
      format: resolvedFormat,
      columns,
      meta: {
        row_count: rows.length,
        generated_at: generatedAt,
      },
    };

    if (resolvedFormat === "csv") {
      response.content_type = "text/csv";
      response.file_name = `${filePrefix}-${generatedAt.slice(0, 10)}.csv`;
      response.content = this.toCsv(columns, rows);
    } else {
      response.data = rows;
    }

    return response;
  }

  private toCsv(columns: string[], rows: ExportRow[]) {
    const lines = [columns.join(",")];
    for (const row of rows) {
      const line = columns.map((column) => this.escapeCsv(row[column])).join(",");
      lines.push(line);
    }
    return lines.join("\n");
  }

  private escapeCsv(value: ExportValue) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) return `"${str.replace(/"/g, "\"\"")}"`;
    return str;
  }
}
