import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateLoyaltyAccountDto } from "./dto/create-loyalty-account.dto";
import { IssuePointsDto } from "./dto/issue-points.dto";

@Injectable()
export class LoyaltyService {
  constructor(private readonly prisma: PrismaService) {}

  async listCustomers(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.q
        ? {
            name: {
              contains: query.q,
              mode: "insensitive" as const,
            },
          }
        : {}),
    };

    const [total, customers] = await this.prisma.$transaction([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({ where, orderBy: { name: "asc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: customers.map((customer: any) => ({
        id: customer.id,
        name: customer.name,
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createCustomer(groupId: string, subsidiaryId: string, body: CreateCustomerDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const customer = await this.prisma.customer.create({
      data: {
        groupId,
        subsidiaryId,
        name: body.name,
        email: body.email,
        phone: body.phone,
      },
    });

    return {
      id: customer.id,
      name: customer.name,
      email: customer.email ?? undefined,
      phone: customer.phone ?? undefined,
    };
  }

  async listLoyaltyAccounts(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
    };

    const [total, accounts] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.count({ where }),
      this.prisma.loyaltyAccount.findMany({ where, orderBy: { createdAt: "desc" }, skip: query.offset ?? 0, take: query.limit ?? 50 }),
    ]);

    return {
      data: accounts.map((account: any) => ({
        id: account.id,
        customer_id: account.customerId,
        points_balance: account.pointsBalance,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createLoyaltyAccount(groupId: string, subsidiaryId: string, body: CreateLoyaltyAccountDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const account = await this.prisma.loyaltyAccount.create({
      data: {
        groupId,
        subsidiaryId,
        customerId: body.customer_id,
      },
    });

    return {
      id: account.id,
      customer_id: account.customerId,
      points_balance: account.pointsBalance,
    };
  }

  async issuePoints(groupId: string, subsidiaryId: string, body: IssuePointsDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const account = await this.prisma.loyaltyAccount.findFirst({
      where: { customerId: body.customer_id, groupId, subsidiaryId },
    });

    if (!account) throw new NotFoundException("Loyalty account not found");

    const [updated] = await this.prisma.$transaction([
      this.prisma.loyaltyAccount.update({
        where: { id: account.id },
        data: { pointsBalance: { increment: body.points } },
      }),
      this.prisma.pointsLedger.create({
        data: {
          groupId,
          subsidiaryId,
          loyaltyAccountId: account.id,
          points: body.points,
          reason: body.reason,
        },
      }),
    ]);

    return {
      id: updated.id,
      customer_id: updated.customerId,
      points_balance: updated.pointsBalance,
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
