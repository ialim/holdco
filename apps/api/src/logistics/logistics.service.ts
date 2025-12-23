import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateShipmentDto } from "./dto/create-shipment.dto";
import { LogisticsGatewayFactory } from "./logistics-gateway.factory";

@Injectable()
export class LogisticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gatewayFactory: LogisticsGatewayFactory,
  ) {}

  async listShipments(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, shipments] = await this.prisma.$transaction([
      this.prisma.shipment.count({ where }),
      this.prisma.shipment.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: shipments.map((shipment: any) => ({
        id: shipment.id,
        order_id: shipment.orderId,
        carrier: shipment.carrier,
        status: shipment.status,
        tracking_no: shipment.trackingNo ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createShipment(groupId: string, subsidiaryId: string, body: CreateShipmentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const gateway = this.gatewayFactory.get(body.carrier);
    const carrier = gateway.name;
    const gatewayResult = body.tracking_no
      ? { tracking_no: body.tracking_no, status: "created" }
      : await gateway.createShipment({ orderId: body.order_id, carrier });

    const shipment = await this.prisma.shipment.create({
      data: {
        groupId,
        subsidiaryId,
        orderId: body.order_id,
        carrier,
        trackingNo: gatewayResult.tracking_no,
        status: gatewayResult.status ?? "created",
      },
    });

    return {
      id: shipment.id,
      order_id: shipment.orderId,
      carrier: shipment.carrier,
      status: shipment.status,
      tracking_no: shipment.trackingNo ?? undefined,
    };
  }

  async getShipment(groupId: string, subsidiaryId: string, shipmentId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const shipment = await this.prisma.shipment.findFirst({
      where: { id: shipmentId, groupId, subsidiaryId },
    });

    if (!shipment) throw new NotFoundException("Shipment not found");

    return {
      id: shipment.id,
      order_id: shipment.orderId,
      carrier: shipment.carrier,
      status: shipment.status,
      tracking_no: shipment.trackingNo ?? undefined,
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
