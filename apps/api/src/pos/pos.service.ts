import { BadRequestException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { sign } from "jsonwebtoken";
import { promisify } from "util";
import { mapRolesToPermissions } from "../auth/permissions.mapper";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePosDeviceDto } from "./dto/create-pos-device.dto";
import { UpdatePosDeviceDto } from "./dto/update-pos-device.dto";
import { ListPosDevicesDto } from "./dto/list-pos-devices.dto";
import { ListPosShiftsDto } from "./dto/list-pos-shifts.dto";
import { StartPosShiftDto } from "./dto/start-pos-shift.dto";
import { ClosePosShiftDto } from "./dto/close-pos-shift.dto";
import { PosCashierLoginDto } from "./dto/pos-cashier-login.dto";
import { PosCashierPinDto } from "./dto/pos-cashier-pin.dto";
import { ActivatePosDeviceDto } from "./dto/activate-pos-device.dto";
import { ListQueryDto } from "../common/dto/list-query.dto";

const scryptAsync = promisify(scrypt);
const DEVICE_TOKEN_TTL_SECONDS = 60 * 60 * 24;
const DEVICE_TOKEN_PERMISSIONS = [
  "catalog.category.read",
  "catalog.brand.read",
  "catalog.facet.read",
  "catalog.product.read",
  "catalog.variant.read",
  "pricing.price_list.read",
  "pricing.price_rule.read",
  "pos.devices.read",
  "pos.shifts.read",
  "pos.shifts.manage",
  "tenancy.locations.read",
  "orders.write",
  "payments.intent.create",
  "payments.capture",
  "inventory.stock.reserve",
  "loyalty.customer.read",
  "loyalty.points.issue",
];

@Injectable()
export class PosService {
  constructor(private readonly prisma: PrismaService) {}

  async listDevices(groupId: string, query: ListPosDevicesDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const where: Prisma.PosDeviceWhereInput = {
      groupId,
      ...(query.subsidiary_id ? { subsidiaryId: query.subsidiary_id } : {}),
      ...(query.location_id ? { locationId: query.location_id } : {}),
      ...(query.device_id ? { deviceId: query.device_id } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.q
        ? {
            OR: [
              { name: { contains: query.q, mode: "insensitive" as const } },
              { deviceId: { contains: query.q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    };

    const [total, devices] = await this.prisma.$transaction([
      this.prisma.posDevice.count({ where }),
      this.prisma.posDevice.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: devices.map((device) => this.mapDevice(device)),
      meta: this.buildMeta(query, total),
    };
  }

  async upsertDevice(groupId: string, subsidiaryId: string, channel: string | undefined, body: CreatePosDeviceDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    this.assertProvisioningChannel(channel);

    const location = await this.prisma.location.findFirst({
      where: { id: body.location_id, groupId, subsidiaryId },
    });
    if (!location) throw new NotFoundException("Location not found");

    const now = new Date();
    const existing = await this.prisma.posDevice.findFirst({
      where: { groupId, deviceId: body.device_id },
    });

    if (!existing) {
      const created = await this.prisma.posDevice.create({
        data: {
          groupId,
          subsidiaryId,
          locationId: body.location_id,
          deviceId: body.device_id,
          name: body.name,
          status: body.status ?? "active",
          metadata: this.toJsonValue(body.metadata),
          lastSeenAt: now,
        },
      });
      return this.mapDevice(created);
    }

    if (existing.subsidiaryId !== subsidiaryId) {
      throw new BadRequestException("Device belongs to a different subsidiary");
    }

    const device = await this.prisma.posDevice.update({
      where: { id: existing.id },
      data: {
        location: { connect: { id: body.location_id } },
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.metadata !== undefined ? { metadata: this.toJsonValue(body.metadata) } : {}),
        lastSeenAt: now,
      },
    });

    return this.mapDevice(device);
  }

  async updateDevice(groupId: string, deviceId: string, channel: string | undefined, body: UpdatePosDeviceDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    this.assertProvisioningChannel(channel);

    const existing = await this.prisma.posDevice.findFirst({ where: { groupId, deviceId } });
    if (!existing) throw new NotFoundException("Device not found");

    if (body.location_id) {
      const location = await this.prisma.location.findFirst({
        where: { id: body.location_id, groupId, subsidiaryId: existing.subsidiaryId },
      });
      if (!location) throw new NotFoundException("Location not found");
    }

    const device = await this.prisma.posDevice.update({
      where: { id: existing.id },
      data: {
        ...(body.location_id ? { location: { connect: { id: body.location_id } } } : {}),
        ...(body.name !== undefined ? { name: body.name } : {}),
        ...(body.status !== undefined ? { status: body.status } : {}),
        ...(body.metadata !== undefined ? { metadata: this.toJsonValue(body.metadata) } : {}),
      },
    });

    return this.mapDevice(device);
  }

  async activateDevice(
    groupId: string,
    subsidiaryId: string,
    locationId: string | undefined,
    body: ActivatePosDeviceDto,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new BadRequestException("JWT_SECRET is not configured");
    }

    const deviceId = body.device_id.trim();
    if (!deviceId) {
      throw new BadRequestException("device_id is required");
    }
    const device = await this.prisma.posDevice.findFirst({
      where: { groupId, deviceId },
    });
    if (!device) {
      throw new NotFoundException("Device is not provisioned in Admin-Ops");
    }
    if (device.subsidiaryId !== subsidiaryId) {
      throw new BadRequestException("Device belongs to a different subsidiary");
    }
    if (device.status === "retired") {
      throw new BadRequestException("Device is retired");
    }

    const expectedLocationId = body.location_id ?? locationId;
    if (expectedLocationId && device.locationId !== expectedLocationId) {
      throw new BadRequestException("Device is not assigned to this location");
    }

    const token = sign(
      {
        sub: device.id,
        device_id: device.deviceId,
        groupId,
        subsidiaryId,
        permissions: DEVICE_TOKEN_PERMISSIONS,
      },
      secret,
      { expiresIn: DEVICE_TOKEN_TTL_SECONDS },
    );

    const updated = await this.prisma.posDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return {
      access_token: token,
      expires_in: DEVICE_TOKEN_TTL_SECONDS,
      device: this.mapDevice(updated),
    };
  }

  async loginCashier(groupId: string, subsidiaryId: string, body: PosCashierLoginDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new BadRequestException("JWT_SECRET is not configured");
    }

    const employeeNo = body.employee_no.trim();
    const employee = await this.prisma.employee.findFirst({
      where: { groupId, subsidiaryId, employeeNo },
      include: { user: { include: { userRoles: { include: { role: true } } } } },
    });
    if (!employee || employee.status !== "active" || !employee.user || employee.user.status !== "active") {
      throw new UnauthorizedException("Invalid cashier credentials");
    }

    const user = employee.user;
    if (!user.posPinHash) {
      throw new UnauthorizedException("Cashier PIN not set");
    }

    const ok = await this.verifyPin(body.pin.trim(), user.posPinHash);
    if (!ok) {
      throw new UnauthorizedException("Invalid cashier credentials");
    }

    const roleNames = user.userRoles
      .filter((role) => !role.subsidiaryId || role.subsidiaryId === subsidiaryId)
      .map((role) => role.role.name);

    if (!roleNames.length) {
      throw new UnauthorizedException("Cashier not assigned to subsidiary");
    }

    const permissions = mapRolesToPermissions(roleNames);
    const token = sign(
      {
        sub: user.id,
        email: user.email,
        roles: roleNames,
        permissions,
      },
      secret,
      { expiresIn: "12h" },
    );

    return {
      access_token: token,
      expires_in: 43200,
      user: {
        id: user.id,
        email: user.email,
        name: user.name ?? "",
        roles: roleNames,
        permissions,
      },
    };
  }

  async setCashierPin(groupId: string, subsidiaryId: string, userId: string, body: PosCashierPinDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const user = await this.prisma.user.findFirst({
      where: { id: userId, groupId },
      include: { userRoles: true },
    });

    if (!user) throw new NotFoundException("User not found");

    const hasSubsidiaryRole = user.userRoles.some(
      (role) => !role.subsidiaryId || role.subsidiaryId === subsidiaryId,
    );
    if (!hasSubsidiaryRole) {
      throw new BadRequestException("User is not assigned to the subsidiary");
    }

    const pinHash = await this.hashPin(body.pin.trim());
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { posPinHash: pinHash },
    });

    return { id: updated.id, status: "set" };
  }

  async listShifts(groupId: string, query: ListPosShiftsDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");

    const openedAt: { gte?: Date; lte?: Date } = {};
    if (query.start_date) openedAt.gte = new Date(query.start_date);
    if (query.end_date) openedAt.lte = new Date(query.end_date);

    const where: Prisma.PosShiftWhereInput = {
      groupId,
      ...(query.subsidiary_id ? { subsidiaryId: query.subsidiary_id } : {}),
      ...(query.location_id ? { locationId: query.location_id } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.opened_by_id ? { openedById: query.opened_by_id } : {}),
      ...(query.closed_by_id ? { closedById: query.closed_by_id } : {}),
      ...(openedAt.gte || openedAt.lte ? { openedAt } : {}),
      ...(query.device_id ? { posDevice: { is: { deviceId: query.device_id } } } : {}),
    };

    const [total, shifts] = await this.prisma.$transaction([
      this.prisma.posShift.count({ where }),
      this.prisma.posShift.findMany({
        where,
        orderBy: { openedAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
        include: { posDevice: true },
      }),
    ]);

    return {
      data: shifts.map((shift) => this.mapShift(shift)),
      meta: this.buildMeta(query, total),
    };
  }

  async getShift(groupId: string, subsidiaryId: string, shiftId: string) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const shift = await this.prisma.posShift.findFirst({
      where: { id: shiftId, groupId, subsidiaryId },
      include: { posDevice: true },
    });
    if (!shift) throw new NotFoundException("Shift not found");

    return this.mapShift(shift);
  }

  async startShift(
    groupId: string,
    subsidiaryId: string,
    locationId: string,
    body: StartPosShiftDto,
    actorId?: string,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");
    if (!locationId) throw new BadRequestException("X-Location-Id header is required");

    const location = await this.prisma.location.findFirst({
      where: { id: locationId, groupId, subsidiaryId },
    });
    if (!location) throw new NotFoundException("Location not found");

    const device = await this.prisma.posDevice.findFirst({
      where: { groupId, subsidiaryId, locationId, deviceId: body.device_id },
    });
    if (!device) throw new NotFoundException("Device not found for location");
    if (device.status !== "active") throw new BadRequestException("Device is not active");

    const existing = await this.prisma.posShift.findFirst({
      where: { groupId, subsidiaryId, locationId, posDeviceId: device.id, status: "open" },
    });
    if (existing) throw new BadRequestException("Shift already open for device");

    const openedBy = body.opened_by_id
      ? await this.assertUser(groupId, body.opened_by_id, "Opened by user not found")
      : await this.resolveUser(groupId, actorId);

    const shift = await this.prisma.posShift.create({
      data: {
        groupId,
        subsidiaryId,
        locationId,
        posDeviceId: device.id,
        openedById: openedBy,
        openingFloat: body.opening_float,
        notes: body.notes,
      },
      include: { posDevice: true },
    });

    await this.prisma.posDevice.update({
      where: { id: device.id },
      data: { lastSeenAt: new Date() },
    });

    return this.mapShift(shift);
  }

  async closeShift(
    groupId: string,
    subsidiaryId: string,
    shiftId: string,
    body: ClosePosShiftDto,
    actorId?: string,
  ) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const existing = await this.prisma.posShift.findFirst({
      where: { id: shiftId, groupId, subsidiaryId },
      include: { posDevice: true },
    });
    if (!existing) throw new NotFoundException("Shift not found");
    if (existing.status !== "open") throw new BadRequestException("Shift is already closed");

    const closedBy = body.closed_by_id
      ? await this.assertUser(groupId, body.closed_by_id, "Closed by user not found")
      : await this.resolveUser(groupId, actorId);

    const shift = await this.prisma.posShift.update({
      where: { id: existing.id },
      data: {
        status: "closed",
        closedAt: new Date(),
        closedById: closedBy,
        ...(body.closing_float !== undefined ? { closingFloat: body.closing_float } : {}),
        ...(body.notes !== undefined ? { notes: body.notes } : {}),
      },
      include: { posDevice: true },
    });

    await this.prisma.posDevice.update({
      where: { id: existing.posDeviceId },
      data: { lastSeenAt: new Date() },
    });

    return this.mapShift(shift);
  }

  private mapDevice(device: {
    id: string;
    groupId: string;
    subsidiaryId: string;
    locationId: string;
    deviceId: string;
    name: string | null;
    status: string;
    metadata: Prisma.JsonValue | null;
    lastSeenAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: device.id,
      group_id: device.groupId,
      subsidiary_id: device.subsidiaryId,
      location_id: device.locationId,
      device_id: device.deviceId,
      name: device.name ?? undefined,
      status: device.status,
      metadata: device.metadata ?? undefined,
      last_seen_at: device.lastSeenAt ? device.lastSeenAt.toISOString() : undefined,
      created_at: device.createdAt.toISOString(),
      updated_at: device.updatedAt.toISOString(),
    };
  }

  private mapShift(shift: {
    id: string;
    groupId: string;
    subsidiaryId: string;
    locationId: string;
    posDeviceId: string;
    status: string;
    openedAt: Date;
    closedAt: Date | null;
    openingFloat: Prisma.Decimal | null;
    closingFloat: Prisma.Decimal | null;
    notes: string | null;
    openedById: string | null;
    closedById: string | null;
    createdAt: Date;
    updatedAt: Date;
    posDevice: { id: string; deviceId: string; name: string | null } | null;
  }) {
    return {
      id: shift.id,
      group_id: shift.groupId,
      subsidiary_id: shift.subsidiaryId,
      location_id: shift.locationId,
      pos_device_id: shift.posDeviceId,
      device_id: shift.posDevice?.deviceId ?? undefined,
      device_name: shift.posDevice?.name ?? undefined,
      status: shift.status,
      opened_at: shift.openedAt.toISOString(),
      closed_at: shift.closedAt ? shift.closedAt.toISOString() : undefined,
      opening_float: this.toNumber(shift.openingFloat),
      closing_float: this.toNumber(shift.closingFloat),
      notes: shift.notes ?? undefined,
      opened_by_id: shift.openedById ?? undefined,
      closed_by_id: shift.closedById ?? undefined,
      created_at: shift.createdAt.toISOString(),
      updated_at: shift.updatedAt.toISOString(),
    };
  }

  private toNumber(value: Prisma.Decimal | null) {
    if (value === null) return undefined;
    return Number(value);
  }

  private toJsonValue(value?: Record<string, unknown>) {
    if (!value) return undefined;
    return value as Prisma.InputJsonValue;
  }

  private async resolveUser(groupId: string, userId?: string) {
    if (!userId) return undefined;
    if (!this.isUuid(userId)) return undefined;
    const user = await this.prisma.user.findFirst({ where: { id: userId, groupId } });
    return user?.id;
  }

  private async assertUser(groupId: string, userId: string, message: string) {
    if (!this.isUuid(userId)) {
      throw new BadRequestException("User id must be a UUID");
    }
    const user = await this.prisma.user.findFirst({ where: { id: userId, groupId } });
    if (!user) {
      throw new BadRequestException(message);
    }
    return user.id;
  }

  private isUuid(value: string) {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
  }

  private async hashPin(pin: string) {
    const salt = randomBytes(16).toString("hex");
    const derived = (await scryptAsync(pin, salt, 64)) as Buffer;
    return `scrypt$${salt}$${derived.toString("hex")}`;
  }

  private async verifyPin(pin: string, stored: string) {
    const [scheme, salt, digest] = stored.split("$");
    if (scheme !== "scrypt" || !salt || !digest) return false;
    const derived = (await scryptAsync(pin, salt, digest.length / 2)) as Buffer;
    const expected = Buffer.from(digest, "hex");
    if (expected.length !== derived.length) return false;
    return timingSafeEqual(expected, derived);
  }

  private assertProvisioningChannel(channel?: string) {
    const normalized = (channel ?? "").toLowerCase();
    if (!normalized || normalized === "retail") {
      throw new ForbiddenException("Device provisioning requires Admin-Ops (X-Channel: admin_ops)");
    }
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }
}
