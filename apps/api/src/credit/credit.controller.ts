import { Body, Controller, Get, Headers, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { AuditService } from "../audit/audit.service";
import { CreditService } from "./credit.service";
import { CreateCreditAccountDto } from "./dto/create-credit-account.dto";
import { CreateRepaymentDto } from "./dto/create-repayment.dto";
import { CreateResellerDto } from "./dto/create-reseller.dto";
import { CreditLimitDto } from "./dto/credit-limit.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class CreditController {
  constructor(
    private readonly creditService: CreditService,
    private readonly auditService: AuditService,
  ) {}

  @Permissions("credit.reseller.read")
  @Get("resellers")
  listResellers(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.creditService.listResellers(groupId, subsidiaryId, query);
  }

  @Permissions("credit.reseller.write")
  @Post("resellers")
  async createReseller(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateResellerDto,
    @Req() req: Request,
  ) {
    const reseller = await this.creditService.createReseller(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "credit.reseller.create",
      entityType: "reseller",
      entityId: reseller.id,
      payload: { name: reseller.name, status: reseller.status },
    });
    return reseller;
  }

  @Permissions("credit.account.read")
  @Get("credit-accounts")
  listCreditAccounts(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.creditService.listCreditAccounts(groupId, subsidiaryId, query);
  }

  @Permissions("credit.account.write")
  @Post("credit-accounts")
  async createCreditAccount(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateCreditAccountDto,
    @Req() req: Request,
  ) {
    const account = await this.creditService.createCreditAccount(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "credit.account.create",
      entityType: "credit_account",
      entityId: account.id,
      payload: {
        reseller_id: account.reseller_id,
        limit_amount: account.limit_amount,
        status: account.status,
      },
    });
    return account;
  }

  @Permissions("credit.limit.write")
  @Post("credit-limits")
  async updateCreditLimit(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreditLimitDto,
    @Req() req: Request,
  ) {
    const account = await this.creditService.updateCreditLimit(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "credit.limit.update",
      entityType: "credit_account",
      entityId: account.id,
      payload: {
        reseller_id: account.reseller_id,
        limit_amount: account.limit_amount,
        used_amount: account.used_amount,
        status: account.status,
        reason: body.reason,
      },
    });
    return account;
  }

  @Permissions("credit.repayment.write")
  @Post("repayments")
  async createRepayment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRepaymentDto,
    @Req() req: Request,
  ) {
    const repayment = await this.creditService.createRepayment(groupId, subsidiaryId, body);
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    await this.auditService.record({
      groupId,
      subsidiaryId,
      actorId,
      action: "credit.repayment.create",
      entityType: "repayment",
      entityId: repayment.id,
      payload: {
        credit_account_id: repayment.credit_account_id,
        amount: repayment.amount,
        paid_at: repayment.paid_at,
        method: body.method,
      },
    });
    return repayment;
  }
}
