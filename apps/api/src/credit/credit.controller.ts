import { Body, Controller, Get, Headers, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { CreditService } from "./credit.service";
import { CreateCreditAccountDto } from "./dto/create-credit-account.dto";
import { CreateRepaymentDto } from "./dto/create-repayment.dto";
import { CreateResellerDto } from "./dto/create-reseller.dto";
import { CreditLimitDto } from "./dto/credit-limit.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class CreditController {
  constructor(private readonly creditService: CreditService) {}

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
  createReseller(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateResellerDto,
  ) {
    return this.creditService.createReseller(groupId, subsidiaryId, body);
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
  createCreditAccount(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateCreditAccountDto,
  ) {
    return this.creditService.createCreditAccount(groupId, subsidiaryId, body);
  }

  @Permissions("credit.limit.write")
  @Post("credit-limits")
  updateCreditLimit(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreditLimitDto,
  ) {
    return this.creditService.updateCreditLimit(groupId, subsidiaryId, body);
  }

  @Permissions("credit.repayment.write")
  @Post("repayments")
  createRepayment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRepaymentDto,
  ) {
    return this.creditService.createRepayment(groupId, subsidiaryId, body);
  }
}
