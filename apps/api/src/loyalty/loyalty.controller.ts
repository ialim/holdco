import { Body, Controller, Get, Headers, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { LoyaltyService } from "./loyalty.service";
import { CreateCustomerDto } from "./dto/create-customer.dto";
import { CreateLoyaltyAccountDto } from "./dto/create-loyalty-account.dto";
import { IssuePointsDto } from "./dto/issue-points.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Permissions("loyalty.customer.read")
  @Get("customers")
  listCustomers(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.loyaltyService.listCustomers(groupId, subsidiaryId, query);
  }

  @Permissions("loyalty.customer.write")
  @Post("customers")
  createCustomer(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateCustomerDto,
  ) {
    return this.loyaltyService.createCustomer(groupId, subsidiaryId, body);
  }

  @Permissions("loyalty.account.read")
  @Get("loyalty-accounts")
  listLoyaltyAccounts(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.loyaltyService.listLoyaltyAccounts(groupId, subsidiaryId, query);
  }

  @Permissions("loyalty.account.write")
  @Post("loyalty-accounts")
  createLoyaltyAccount(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateLoyaltyAccountDto,
  ) {
    return this.loyaltyService.createLoyaltyAccount(groupId, subsidiaryId, body);
  }

  @Permissions("loyalty.points.issue")
  @Post("points/issue")
  issuePoints(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: IssuePointsDto,
  ) {
    return this.loyaltyService.issuePoints(groupId, subsidiaryId, body);
  }
}
