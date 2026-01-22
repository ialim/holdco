import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, SubsidiaryRole } from "@prisma/client";
import { Decimal } from "@prisma/client/runtime/library";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { AddImportCostsDto } from "./dto/add-import-costs.dto";
import { CreateImportShipmentDto } from "./dto/create-import-shipment.dto";
import { CreatePurchaseRequestDto } from "./dto/create-purchase-request.dto";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { ReceiveImportShipmentDto } from "./dto/receive-import-shipment.dto";
import { CreateSupplierInvoiceDto } from "./dto/create-supplier-invoice.dto";
import { CreateSupplierPaymentDto } from "./dto/create-supplier-payment.dto";
import { assertPostingCodeAllowed } from "../finance/ledger-code-rules";

@Injectable()
export class ProcurementService {
  constructor(private readonly prisma: PrismaService) {}

  async listPurchaseRequests(
    groupId: string,
    subsidiaryId: string,
    query: ListQueryDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, requests] = await this.prisma.$transaction([
      this.prisma.purchaseRequest.count({ where }),
      this.prisma.purchaseRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { items: true, requester: true },
      }),
    ]);

    return {
      data: requests.map((request: any) => ({
        id: request.id,
        requester_id: request.requesterId ?? undefined,
        requester_name: request.requester?.name ?? undefined,
        requester_email: request.requester?.email ?? undefined,
        status: request.status,
        needed_by: this.formatDate(request.neededBy),
        notes: request.notes ?? undefined,
        items_count: Array.isArray(request.items) ? request.items.length : 0,
        created_at: request.createdAt.toISOString(),
        items: request.items.map((item: any) => ({
          description: item.description,
          quantity: item.quantity,
          unit: item.unit ?? undefined,
          estimated_unit_cost:
            item.estimatedUnitCost !== null
              ? Number(item.estimatedUnitCost)
              : undefined,
        })),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createPurchaseRequest(
    groupId: string,
    subsidiaryId: string,
    body: CreatePurchaseRequestDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const request = await this.prisma.purchaseRequest.create({
      data: {
        groupId,
        subsidiaryId,
        requesterId: body.requester_id,
        neededBy: body.needed_by ? new Date(body.needed_by) : undefined,
        notes: body.notes,
        items: {
          create: body.items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unit: item.unit,
            estimatedUnitCost: item.estimated_unit_cost,
          })),
        },
      },
      include: { items: true, requester: true },
    });

    return {
      id: request.id,
      requester_id: request.requesterId ?? undefined,
      requester_name: request.requester?.name ?? undefined,
      requester_email: request.requester?.email ?? undefined,
      status: request.status,
      needed_by: this.formatDate(request.neededBy),
      notes: request.notes ?? undefined,
      items_count: Array.isArray(request.items) ? request.items.length : 0,
      created_at: request.createdAt.toISOString(),
      items: request.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit: item.unit ?? undefined,
        estimated_unit_cost:
          item.estimatedUnitCost !== null
            ? Number(item.estimatedUnitCost)
            : undefined,
      })),
    };
  }

  async listPurchaseOrders(
    groupId: string,
    subsidiaryId: string,
    query: ListQueryDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

      const [total, orders] = await this.prisma.$transaction([
        this.prisma.purchaseOrder.count({ where }),
        this.prisma.purchaseOrder.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip: query.offset ?? 0,
          take: query.limit ?? 50,
          include: { items: true, vendor: true },
        }),
      ]);

      return {
        data: orders.map((order: any) => ({
          id: order.id,
          vendor_id: order.vendorId ?? undefined,
          vendor_name: order.vendor?.name ?? undefined,
          status: order.status,
          ordered_at: order.orderedAt ? order.orderedAt.toISOString() : undefined,
          expected_at: this.formatDate(order.expectedAt),
          total_amount:
            order.totalAmount !== null ? Number(order.totalAmount) : undefined,
          currency: order.currency ?? undefined,
          items_count: Array.isArray(order.items) ? order.items.length : 0,
          created_at: order.createdAt.toISOString(),
          items: order.items.map((item: any) => ({
            description: item.description,
            quantity: item.quantity,
            unit_price: Number(item.unitPrice),
            total_price: Number(item.totalPrice),
        })),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createPurchaseOrder(
    groupId: string,
    subsidiaryId: string,
    body: CreatePurchaseOrderDto
  ) {
    if (!groupId)
      throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId)
      throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const items = body.items.map((item) => {
      const totalPrice = item.total_price ?? item.unit_price * item.quantity;
      return {
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice,
      };
    });

    const totalAmount = items.reduce((sum, item) => sum + item.totalPrice, 0);

    const order = await this.prisma.purchaseOrder.create({
      data: {
        groupId,
        subsidiaryId,
        vendorId: body.vendor_id,
        orderedAt: body.ordered_at ? new Date(body.ordered_at) : undefined,
        expectedAt: body.expected_at ? new Date(body.expected_at) : undefined,
        totalAmount,
        currency: body.currency ?? "NGN",
        items: {
          create: items.map((item) => ({
            description: item.description,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
          })),
        },
      },
      include: { items: true },
    });

    return {
      id: order.id,
      vendor_id: order.vendorId ?? undefined,
      status: order.status,
      ordered_at: order.orderedAt ? order.orderedAt.toISOString() : undefined,
      expected_at: this.formatDate(order.expectedAt),
      total_amount:
        order.totalAmount !== null ? Number(order.totalAmount) : undefined,
      currency: order.currency ?? undefined,
      created_at: order.createdAt.toISOString(),
      items: order.items.map((item: any) => ({
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unitPrice),
        total_price: Number(item.totalPrice),
      })),
    };
  }

  async listImportShipments(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { reference: { contains: query.q, mode: Prisma.QueryMode.insensitive } } : {}),
    };

    const [total, shipments] = await this.prisma.$transaction([
      this.prisma.importShipment.count({ where }),
      this.prisma.importShipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: {
          lines: { include: { product: true, variant: true } },
          costLines: true,
          supplier: true,
        },
      }),
    ]);

    return {
      data: shipments.map((shipment: any) => this.mapImportShipment(shipment)),
      meta: this.buildMeta(query, total),
    };
  }

  async getImportShipment(groupId: string, subsidiaryId: string, shipmentId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!shipmentId) throw new BadRequestException("Shipment id is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const shipment = await this.prisma.importShipment.findFirst({
      where: { id: shipmentId, groupId, subsidiaryId },
      include: {
        lines: { include: { product: true, variant: true } },
        costLines: true,
        supplier: true,
      },
    });

    if (!shipment) throw new NotFoundException("Import shipment not found");

    return this.mapImportShipment(shipment);
  }

  async createImportShipment(groupId: string, subsidiaryId: string, body: CreateImportShipmentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    if (body.fx_rate <= 0) throw new BadRequestException("FX rate must be greater than 0");

    const fxRate = new Decimal(body.fx_rate);
    const lineKeys = new Set<string>();
    const lines = body.lines.map((line) => {
      if (line.quantity <= 0) throw new BadRequestException("Quantity must be greater than 0");
      const key = `${line.product_id}:${line.variant_id ?? "none"}`;
      if (lineKeys.has(key)) {
        throw new BadRequestException("Duplicate shipment line for product/variant");
      }
      lineKeys.add(key);
      const unitCost = new Decimal(line.unit_cost);
      if (unitCost.lessThan(0)) throw new BadRequestException("Unit cost must be 0 or greater");
      const baseAmount = unitCost.mul(line.quantity);
      return {
        productId: line.product_id,
        variantId: line.variant_id,
        quantity: line.quantity,
        unitCost,
        baseAmount,
      };
    });

    const baseTotal = lines.reduce((sum, line) => sum.plus(line.baseAmount), new Decimal(0));
    const totalBaseAmount = baseTotal.mul(fxRate);

    const existing = await this.prisma.importShipment.findFirst({
      where: { subsidiaryId, reference: body.reference },
      select: { id: true, status: true },
    });
    if (existing && existing.status !== "draft") {
      throw new BadRequestException("Only draft import shipments can be updated");
    }

    const shipment = await this.prisma.importShipment.upsert({
      where: { subsidiaryId_reference: { subsidiaryId, reference: body.reference } },
      update: {
        supplierId: body.supplier_id,
        currency: body.currency,
        fxRate,
        arrivalDate: body.arrival_date ? new Date(body.arrival_date) : undefined,
        totalBaseAmount,
        totalLandedCost: totalBaseAmount,
        lines: { deleteMany: {}, create: lines },
      },
      create: {
        groupId,
        subsidiaryId,
        supplierId: body.supplier_id,
        reference: body.reference,
        currency: body.currency,
        fxRate,
        arrivalDate: body.arrival_date ? new Date(body.arrival_date) : undefined,
        totalBaseAmount,
        totalLandedCost: totalBaseAmount,
        lines: { create: lines },
      },
      include: { lines: true, costLines: true },
    });

    return {
      id: shipment.id,
      reference: shipment.reference,
      supplier_id: shipment.supplierId ?? undefined,
      currency: shipment.currency,
      fx_rate: Number(shipment.fxRate),
      status: shipment.status,
      arrival_date: this.formatDate(shipment.arrivalDate),
      total_base_amount: Number(shipment.totalBaseAmount),
      total_landed_cost: Number(shipment.totalLandedCost),
      lines: shipment.lines.map((line: any) => ({
        id: line.id,
        product_id: line.productId,
        variant_id: line.variantId ?? undefined,
        quantity: line.quantity,
        unit_cost: Number(line.unitCost),
        base_amount: Number(line.baseAmount),
      })),
      costs: shipment.costLines.map((cost: any) => ({
        id: cost.id,
        category: cost.category,
        amount: Number(cost.amount),
        notes: cost.notes ?? undefined,
      })),
    };
  }

  async addImportCosts(groupId: string, subsidiaryId: string, id: string, body: AddImportCostsDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!id) throw new BadRequestException("Shipment id is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const shipment = await this.prisma.importShipment.findFirst({
      where: { id, groupId, subsidiaryId },
      include: { costLines: true },
    });
    if (!shipment) throw new NotFoundException("Import shipment not found");
    if (shipment.status === "received") throw new BadRequestException("Cannot add costs to a received shipment");

    await this.prisma.importCostLine.createMany({
      data: body.costs.map((cost) => ({
        shipmentId: shipment.id,
        category: cost.category,
        amount: new Decimal(cost.amount),
        notes: cost.notes,
      })),
    });

    const updated = await this.prisma.importShipment.findUnique({
      where: { id: shipment.id },
      include: { lines: true, costLines: true },
    });
    if (!updated) throw new NotFoundException("Import shipment not found");

    const extraCosts = updated.costLines.reduce((sum, cost) => sum.plus(cost.amount), new Decimal(0));
    const totalLandedCost = new Decimal(updated.totalBaseAmount).plus(extraCosts);
    const recalculated = await this.prisma.importShipment.update({
      where: { id: updated.id },
      data: { totalLandedCost },
      include: { costLines: true },
    });

    return {
      id: recalculated.id,
      reference: recalculated.reference,
      status: recalculated.status,
      total_base_amount: Number(updated.totalBaseAmount),
      total_landed_cost: Number(recalculated.totalLandedCost),
      costs: recalculated.costLines.map((cost: any) => ({
        id: cost.id,
        category: cost.category,
        amount: Number(cost.amount),
        notes: cost.notes ?? undefined,
      })),
    };
  }

  async finalizeImportShipment(groupId: string, subsidiaryId: string, id: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!id) throw new BadRequestException("Shipment id is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const shipment = await this.prisma.importShipment.findFirst({
      where: { id, groupId, subsidiaryId },
      include: { lines: true, costLines: true },
    });
    if (!shipment) throw new NotFoundException("Import shipment not found");
    if (shipment.status === "received") throw new BadRequestException("Cannot finalize a received shipment");
    if (!shipment.lines.length) throw new BadRequestException("Import shipment has no lines");

    const baseTotal = shipment.lines.reduce((sum, line) => sum.plus(line.baseAmount), new Decimal(0));
    const baseTotalLocal = baseTotal.mul(shipment.fxRate);
    const extraCosts = shipment.costLines.reduce((sum, cost) => sum.plus(cost.amount), new Decimal(0));
    const totalLanded = baseTotalLocal.plus(extraCosts);

    const updates = shipment.lines.map((line) => {
      const baseLocal = new Decimal(line.baseAmount).mul(shipment.fxRate);
      const allocation = baseTotalLocal.equals(0)
        ? new Decimal(0)
        : extraCosts.mul(baseLocal.div(baseTotalLocal));
      const landedAmount = baseLocal.plus(allocation);
      const landedUnitCost = landedAmount.div(line.quantity);
      return {
        id: line.id,
        landedAmount,
        landedUnitCost,
      };
    });

    const updated = await this.prisma.$transaction(async (tx) => {
      for (const update of updates) {
        await tx.importShipmentLine.update({
          where: { id: update.id },
          data: {
            landedAmount: update.landedAmount,
            landedUnitCost: update.landedUnitCost,
          },
        });
      }

      return tx.importShipment.update({
        where: { id: shipment.id },
        data: {
          status: "cleared",
          clearedDate: new Date(),
          totalBaseAmount: baseTotalLocal,
          totalLandedCost: totalLanded,
        },
        include: { lines: true, costLines: true },
      });
    });

    return {
      id: updated.id,
      reference: updated.reference,
      status: updated.status,
      total_base_amount: Number(updated.totalBaseAmount),
      total_landed_cost: Number(updated.totalLandedCost),
      lines: updated.lines.map((line: any) => ({
        id: line.id,
        product_id: line.productId,
        variant_id: line.variantId ?? undefined,
        quantity: line.quantity,
        unit_cost: Number(line.unitCost),
        base_amount: Number(line.baseAmount),
        landed_unit_cost: line.landedUnitCost !== null ? Number(line.landedUnitCost) : undefined,
        landed_amount: line.landedAmount !== null ? Number(line.landedAmount) : undefined,
      })),
    };
  }

  async receiveImportShipment(
    groupId: string,
    subsidiaryId: string,
    id: string,
    body: ReceiveImportShipmentDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!id) throw new BadRequestException("Shipment id is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const shipment = await this.prisma.importShipment.findFirst({
      where: { id, groupId, subsidiaryId },
      include: { lines: true },
    });
    if (!shipment) throw new NotFoundException("Import shipment not found");
    if (shipment.status === "received") throw new BadRequestException("Shipment already received");

    const existingReceipt = await this.prisma.goodsReceipt.findFirst({
      where: { shipmentId: shipment.id },
      select: { id: true },
    });
    if (existingReceipt) throw new BadRequestException("Shipment already has a receipt");

    const location = await this.prisma.location.findFirst({
      where: { id: body.location_id, groupId, subsidiaryId },
      select: { id: true },
    });
    if (!location) throw new BadRequestException("Location not found for subsidiary");

    const lineKey = (productId: string, variantId: string | null) =>
      `${productId}:${variantId ?? "none"}`;
    const shipmentLines = new Map<string, typeof shipment.lines[number]>();
    for (const line of shipment.lines) {
      const key = lineKey(line.productId, line.variantId ?? null);
      if (shipmentLines.has(key)) {
        throw new BadRequestException("Shipment has duplicate lines for product/variant");
      }
      shipmentLines.set(key, line);
    }

    let totalReceived = 0;
    let totalRejected = 0;

    for (const line of body.lines) {
      const key = lineKey(line.product_id, line.variant_id ?? null);
      const shipmentLine = shipmentLines.get(key);
      if (!shipmentLine) {
        throw new BadRequestException("Receipt line does not match shipment line");
      }
      const received = line.quantity_received ?? 0;
      const rejected = line.quantity_rejected ?? 0;
      if (received + rejected !== shipmentLine.quantity) {
        throw new BadRequestException("Receipt quantities must match shipment quantities");
      }
      totalReceived += received;
      totalRejected += rejected;
    }

    if (totalReceived <= 0 && totalRejected <= 0) {
      throw new BadRequestException("Receipt quantities must be greater than 0");
    }

    const receiptStatus =
      totalReceived > 0 && totalRejected > 0 ? "partial" : totalReceived > 0 ? "accepted" : "rejected";

    const receivedAt = body.received_at ? new Date(body.received_at) : new Date();

    const receipt = await this.prisma.$transaction(async (tx) => {
      const createdReceipt = await tx.goodsReceipt.create({
        data: {
          groupId,
          subsidiaryId,
          shipmentId: shipment.id,
          locationId: body.location_id,
          status: receiptStatus,
          receivedAt,
          notes: body.notes,
          lines: {
            create: body.lines.map((line) => {
              const shipmentLine = shipmentLines.get(lineKey(line.product_id, line.variant_id ?? null));
              return {
                shipmentLineId: shipmentLine?.id,
                productId: line.product_id,
                variantId: line.variant_id,
                quantityReceived: line.quantity_received,
                quantityRejected: line.quantity_rejected ?? 0,
                unitCost: shipmentLine?.landedUnitCost ?? shipmentLine?.unitCost.mul(shipment.fxRate),
              };
            }),
          },
        },
        include: { lines: true },
      });

      for (const line of body.lines) {
        if (line.quantity_received <= 0) continue;
        const variantKey = line.variant_id ?? null;
        const existingLevel = await tx.stockLevel.findFirst({
          where: {
            groupId,
            subsidiaryId,
            locationId: body.location_id,
            productId: line.product_id,
            variantId: variantKey,
          },
        });

        await tx.stockAdjustment.create({
          data: {
            groupId,
            subsidiaryId,
            locationId: body.location_id,
            productId: line.product_id,
            variantId: line.variant_id,
            quantity: line.quantity_received,
            reason: "import_receipt",
          },
        });

        if (existingLevel) {
          await tx.stockLevel.update({
            where: { id: existingLevel.id },
            data: { onHand: { increment: line.quantity_received } },
          });
        } else {
          await tx.stockLevel.create({
            data: {
              groupId,
              subsidiaryId,
              locationId: body.location_id,
              productId: line.product_id,
              variantId: line.variant_id,
              onHand: line.quantity_received,
              reserved: 0,
            },
          });
        }
      }

      await tx.importShipment.update({
        where: { id: shipment.id },
        data: { status: "received" },
      });

      return createdReceipt;
    });

    return {
      id: receipt.id,
      shipment_id: receipt.shipmentId ?? undefined,
      location_id: receipt.locationId,
      status: receipt.status,
      received_at: receipt.receivedAt.toISOString(),
      notes: receipt.notes ?? undefined,
      lines: receipt.lines.map((line: any) => ({
        product_id: line.productId,
        variant_id: line.variantId ?? undefined,
        quantity_received: line.quantityReceived,
        quantity_rejected: line.quantityRejected,
        unit_cost: line.unitCost !== null ? Number(line.unitCost) : undefined,
      })),
    };
  }

  async listSupplierInvoices(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
      ...(query.q ? { reference: { contains: query.q, mode: Prisma.QueryMode.insensitive } } : {}),
    };

    const [total, invoices] = await this.prisma.$transaction([
      this.prisma.supplierInvoice.count({ where }),
      this.prisma.supplierInvoice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { supplier: true, vendor: true, payments: true },
      }),
    ]);

    return {
      data: invoices.map((invoice) => {
        const paid = invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0));
        const totalAmount = new Decimal(invoice.totalAmount);
        return {
          id: invoice.id,
          reference: invoice.reference,
          status: invoice.status,
          supplier_id: invoice.supplierId ?? undefined,
          supplier_name: invoice.supplier?.name ?? undefined,
          vendor_id: invoice.vendorId ?? undefined,
          vendor_name: invoice.vendor?.name ?? undefined,
          currency: invoice.currency,
          fx_rate: Number(invoice.fxRate),
          subtotal_amount: Number(invoice.subtotalAmount),
          tax_amount: Number(invoice.taxAmount),
          total_amount: Number(invoice.totalAmount),
          paid_amount: Number(paid),
          balance_amount: Number(totalAmount.minus(paid)),
          issue_date: invoice.issueDate.toISOString().slice(0, 10),
          due_date: this.formatDate(invoice.dueDate),
          notes: invoice.notes ?? undefined,
        };
      }),
      meta: this.buildMeta(query, total),
    };
  }

  async getSupplierInvoice(groupId: string, subsidiaryId: string, id: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const invoice = await this.prisma.supplierInvoice.findFirst({
      where: { id, groupId, subsidiaryId },
      include: { supplier: true, vendor: true, payments: true },
    });
    if (!invoice) throw new NotFoundException("Supplier invoice not found");

    const paid = invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0));
    const totalAmount = new Decimal(invoice.totalAmount);

    return {
      id: invoice.id,
      reference: invoice.reference,
      status: invoice.status,
      supplier_id: invoice.supplierId ?? undefined,
      supplier_name: invoice.supplier?.name ?? undefined,
      vendor_id: invoice.vendorId ?? undefined,
      vendor_name: invoice.vendor?.name ?? undefined,
      currency: invoice.currency,
      fx_rate: Number(invoice.fxRate),
      subtotal_amount: Number(invoice.subtotalAmount),
      tax_amount: Number(invoice.taxAmount),
      total_amount: Number(invoice.totalAmount),
      paid_amount: Number(paid),
      balance_amount: Number(totalAmount.minus(paid)),
      issue_date: invoice.issueDate.toISOString().slice(0, 10),
      due_date: this.formatDate(invoice.dueDate),
      notes: invoice.notes ?? undefined,
      payments: invoice.payments.map((payment) => ({
        id: payment.id,
        amount: Number(payment.amount),
        currency: payment.currency,
        paid_at: payment.paidAt.toISOString(),
        method: payment.method ?? undefined,
        reference: payment.reference ?? undefined,
        notes: payment.notes ?? undefined,
      })),
    };
  }

  async createSupplierInvoice(groupId: string, subsidiaryId: string, body: CreateSupplierInvoiceDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    if (!body.supplier_id && !body.vendor_id) {
      throw new BadRequestException("Supplier or vendor is required");
    }

    const supplier = body.supplier_id
      ? await this.prisma.supplier.findFirst({ where: { id: body.supplier_id, groupId } })
      : null;
    if (body.supplier_id && !supplier) throw new NotFoundException("Supplier not found");

    const vendor = body.vendor_id
      ? await this.prisma.externalClient.findFirst({ where: { id: body.vendor_id, groupId } })
      : null;
    if (body.vendor_id && !vendor) throw new NotFoundException("Vendor not found");

    const purchaseOrder = body.purchase_order_id
      ? await this.prisma.purchaseOrder.findFirst({ where: { id: body.purchase_order_id, groupId, subsidiaryId } })
      : null;
    if (body.purchase_order_id && !purchaseOrder) throw new NotFoundException("Purchase order not found");

    const importShipment = body.import_shipment_id
      ? await this.prisma.importShipment.findFirst({ where: { id: body.import_shipment_id, groupId, subsidiaryId } })
      : null;
    if (body.import_shipment_id && !importShipment) throw new NotFoundException("Import shipment not found");

    const currency = body.currency ?? "NGN";
    const fxRate = new Decimal(body.fx_rate ?? 1);
    if (fxRate.lte(0)) throw new BadRequestException("FX rate must be greater than 0");

    const subtotal = new Decimal(body.subtotal_amount);
    const taxAmount = new Decimal(body.tax_amount ?? 0);
    const totalAmount = body.total_amount !== undefined ? new Decimal(body.total_amount) : subtotal.plus(taxAmount);

    const issueDate = body.issue_date ? new Date(body.issue_date) : new Date();
    const dueDate = body.due_date ? new Date(body.due_date) : undefined;

    const expenseCode = body.expense_account_code ?? "1200";
    const payableCode = body.payable_account_code ?? "2000";

    const vendorId = body.vendor_id ?? supplier?.externalClientId ?? undefined;

    const invoice = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplierInvoice.create({
        data: {
          groupId,
          subsidiaryId,
          supplierId: body.supplier_id,
          vendorId,
          purchaseOrderId: body.purchase_order_id,
          importShipmentId: body.import_shipment_id,
          reference: body.reference,
          status: "open",
          currency,
          fxRate,
          expenseAccountCode: expenseCode,
          payableAccountCode: payableCode,
          subtotalAmount: subtotal,
          taxAmount,
          totalAmount,
          issueDate,
          dueDate,
          notes: body.notes,
        },
        include: { supplier: true, vendor: true },
      });

      await this.postSupplierInvoiceToLedger(tx, created, expenseCode, payableCode, issueDate);
      return created;
    });

    return {
      id: invoice.id,
      reference: invoice.reference,
      status: invoice.status,
      supplier_id: invoice.supplierId ?? undefined,
      supplier_name: invoice.supplier?.name ?? undefined,
      vendor_id: invoice.vendorId ?? undefined,
      vendor_name: invoice.vendor?.name ?? undefined,
      currency: invoice.currency,
      fx_rate: Number(invoice.fxRate),
      subtotal_amount: Number(invoice.subtotalAmount),
      tax_amount: Number(invoice.taxAmount),
      total_amount: Number(invoice.totalAmount),
      issue_date: invoice.issueDate.toISOString().slice(0, 10),
      due_date: this.formatDate(invoice.dueDate),
      notes: invoice.notes ?? undefined,
    };
  }

  async listSupplierPayments(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const where = { groupId, subsidiaryId };

    const [total, payments] = await this.prisma.$transaction([
      this.prisma.supplierPayment.count({ where }),
      this.prisma.supplierPayment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { invoice: { include: { supplier: true, vendor: true } } },
      }),
    ]);

    return {
      data: payments.map((payment) => ({
        id: payment.id,
        supplier_invoice_id: payment.supplierInvoiceId,
        reference: payment.reference ?? undefined,
        amount: Number(payment.amount),
        currency: payment.currency,
        paid_at: payment.paidAt.toISOString(),
        method: payment.method ?? undefined,
        notes: payment.notes ?? undefined,
        invoice_reference: payment.invoice.reference,
        supplier_name: payment.invoice.supplier?.name ?? undefined,
        vendor_name: payment.invoice.vendor?.name ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createSupplierPayment(groupId: string, subsidiaryId: string, body: CreateSupplierPaymentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    await this.assertTradingSubsidiary(groupId, subsidiaryId);

    const invoice = await this.prisma.supplierInvoice.findFirst({
      where: { id: body.supplier_invoice_id, groupId, subsidiaryId },
      include: { payments: true },
    });
    if (!invoice) throw new NotFoundException("Supplier invoice not found");
    if (invoice.status === "paid") throw new BadRequestException("Invoice already paid");

    const amount = new Decimal(body.amount);
    const currency = body.currency ?? invoice.currency;
    const paidAt = body.paid_at ? new Date(body.paid_at) : new Date();
    const paymentAccountCode = body.payment_account_code ?? "1000";

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supplierPayment.create({
        data: {
          groupId,
          subsidiaryId,
          supplierInvoiceId: invoice.id,
          amount,
          currency,
          paymentAccountCode,
          paidAt,
          method: body.method,
          reference: body.reference,
          notes: body.notes,
        },
      });

      await this.postSupplierPaymentToLedger(tx, invoice, created, paymentAccountCode, paidAt);

      const totalPaid = invoice.payments.reduce((sum, payment) => sum.plus(payment.amount), new Decimal(0)).plus(amount);
      const newStatus = totalPaid.greaterThanOrEqualTo(invoice.totalAmount)
        ? "paid"
        : "partial";

      await tx.supplierInvoice.update({
        where: { id: invoice.id },
        data: { status: newStatus },
      });

      return created;
    });

    return {
      id: payment.id,
      supplier_invoice_id: payment.supplierInvoiceId,
      amount: Number(payment.amount),
      currency: payment.currency,
      paid_at: payment.paidAt.toISOString(),
      method: payment.method ?? undefined,
      reference: payment.reference ?? undefined,
      notes: payment.notes ?? undefined,
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }

  private mapImportShipment(shipment: any) {
    return {
      id: shipment.id,
      reference: shipment.reference,
      supplier_id: shipment.supplierId ?? undefined,
      supplier_name: shipment.supplier?.name ?? undefined,
      currency: shipment.currency,
      fx_rate: Number(shipment.fxRate),
      status: shipment.status,
      arrival_date: this.formatDate(shipment.arrivalDate),
      cleared_date: this.formatDate(shipment.clearedDate),
      total_base_amount: Number(shipment.totalBaseAmount),
      total_landed_cost: Number(shipment.totalLandedCost),
      created_at: shipment.createdAt.toISOString(),
      lines_count: Array.isArray(shipment.lines) ? shipment.lines.length : 0,
      lines: (shipment.lines ?? []).map((line: any) => ({
        id: line.id,
        product_id: line.productId,
        product_name: line.product?.name ?? undefined,
        product_sku: line.product?.sku ?? undefined,
        variant_id: line.variantId ?? undefined,
        variant_label: this.formatVariantLabel(line.variant),
        quantity: line.quantity,
        unit_cost: Number(line.unitCost),
        base_amount: Number(line.baseAmount),
        landed_unit_cost: line.landedUnitCost !== null ? Number(line.landedUnitCost) : undefined,
        landed_amount: line.landedAmount !== null ? Number(line.landedAmount) : undefined,
      })),
      costs: (shipment.costLines ?? []).map((cost: any) => ({
        id: cost.id,
        category: cost.category,
        amount: Number(cost.amount),
        notes: cost.notes ?? undefined,
      })),
    };
  }

  private async assertTradingSubsidiary(groupId: string, subsidiaryId: string) {
    const subsidiary = await this.prisma.subsidiary.findFirst({
      where: { id: subsidiaryId, groupId },
      select: { id: true, role: true },
    });
    if (!subsidiary) throw new BadRequestException("Subsidiary not found");
    if (subsidiary.role !== SubsidiaryRole.PROCUREMENT_TRADING) {
      throw new BadRequestException("Only the procurement/trading subsidiary can perform this action");
    }
    return subsidiary;
  }

  private async postSupplierInvoiceToLedger(
    tx: Prisma.TransactionClient,
    invoice: {
      id: string;
      subsidiaryId: string;
      totalAmount: Prisma.Decimal;
      payableAccountCode: string;
    },
    expenseCode: string,
    payableCode: string,
    issueDate: Date
  ) {
    assertPostingCodeAllowed(expenseCode);
    assertPostingCodeAllowed(payableCode);

    const [expenseAccountId, payableAccountId] = await Promise.all([
      this.getLedgerAccountId(tx, invoice.subsidiaryId, expenseCode),
      this.getLedgerAccountId(tx, invoice.subsidiaryId, payableCode),
    ]);

    const period = this.toPeriod(issueDate);

    await tx.ledgerEntry.deleteMany({ where: { sourceType: "SUPPLIER_INVOICE", sourceRef: invoice.id } });
    await tx.ledgerEntry.create({
      data: {
        companyId: invoice.subsidiaryId,
        period,
        entryDate: issueDate,
        accountId: expenseAccountId,
        debit: invoice.totalAmount,
        credit: new Decimal(0),
        memo: `Supplier invoice (${period})`,
        sourceType: "SUPPLIER_INVOICE",
        sourceRef: invoice.id,
      },
    });
    await tx.ledgerEntry.create({
      data: {
        companyId: invoice.subsidiaryId,
        period,
        entryDate: issueDate,
        accountId: payableAccountId,
        debit: new Decimal(0),
        credit: invoice.totalAmount,
        memo: `Supplier invoice (${period})`,
        sourceType: "SUPPLIER_INVOICE",
        sourceRef: invoice.id,
      },
    });
  }

  private async postSupplierPaymentToLedger(
    tx: Prisma.TransactionClient,
    invoice: {
      id: string;
      subsidiaryId: string;
      payableAccountCode: string;
    },
    payment: {
      id: string;
      amount: Prisma.Decimal;
    },
    paymentAccountCode: string,
    paidAt: Date
  ) {
    assertPostingCodeAllowed(paymentAccountCode);
    assertPostingCodeAllowed(invoice.payableAccountCode);

    const [paymentAccountId, payableAccountId] = await Promise.all([
      this.getLedgerAccountId(tx, invoice.subsidiaryId, paymentAccountCode),
      this.getLedgerAccountId(tx, invoice.subsidiaryId, invoice.payableAccountCode),
    ]);

    const period = this.toPeriod(paidAt);

    await tx.ledgerEntry.create({
      data: {
        companyId: invoice.subsidiaryId,
        period,
        entryDate: paidAt,
        accountId: payableAccountId,
        debit: payment.amount,
        credit: new Decimal(0),
        memo: `Supplier payment (${period})`,
        sourceType: "SUPPLIER_PAYMENT",
        sourceRef: payment.id,
      },
    });
    await tx.ledgerEntry.create({
      data: {
        companyId: invoice.subsidiaryId,
        period,
        entryDate: paidAt,
        accountId: paymentAccountId,
        debit: new Decimal(0),
        credit: payment.amount,
        memo: `Supplier payment (${period})`,
        sourceType: "SUPPLIER_PAYMENT",
        sourceRef: payment.id,
      },
    });
  }

  private async getLedgerAccountId(db: Prisma.TransactionClient, companyId: string, code: string) {
    const account = await db.ledgerAccount.findUnique({ where: { companyId_code: { companyId, code } } });
    if (!account) throw new BadRequestException(`Ledger account ${code} missing for company ${companyId}`);
    return account.id;
  }

  private toPeriod(value: Date) {
    return value.toISOString().slice(0, 7);
  }

  private formatDate(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : undefined;
  }

  private formatVariantLabel(variant: { size?: string | null; unit?: string | null; barcode?: string | null } | null | undefined) {
    if (!variant) return undefined;
    const size = variant.size ?? "";
    const unit = variant.unit ? ` ${variant.unit}` : "";
    const barcode = variant.barcode ? ` - ${variant.barcode}` : "";
    const label = `${size}${unit}${barcode}`.trim();
    return label || undefined;
  }
}
