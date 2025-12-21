import {
  Controller,
  Get,
  Headers,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "./dto/list-query.dto";
import { TenancyService } from "./tenancy.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class TenancyController {
  constructor(private readonly tenancyService: TenancyService) {}

  @Permissions("tenancy.read")
  @Get("tenants")
  listTenants(@Req() req: Request, @Headers("x-group-id") groupId?: string) {
    const headerGroupId = groupId;
    const tokenGroupId = (req as any).user?.groupId ?? (req as any).user?.group_id;
    return this.tenancyService.listTenants(headerGroupId ?? tokenGroupId);
  }

  @Permissions("tenancy.users.read")
  @Get("users")
  listUsers(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.tenancyService.listUsers({
      groupId,
      subsidiaryId,
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
    });
  }
}
