import {
  Body,
  Controller,
  Get,
  Headers,
  Post,
  Query,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreateLocationDto } from "./dto/create-location.dto";
import { CreateAppUserDto } from "./dto/create-app-user.dto";
import { CreateSubsidiaryDto } from "./dto/create-subsidiary.dto";
import { ListQueryDto } from "./dto/list-query.dto";
import { ListLocationsDto } from "./dto/list-locations.dto";
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

  @Permissions("tenancy.read")
  @Get("tenant-groups")
  listTenantGroups(@Req() req: Request, @Headers("x-group-id") groupId?: string) {
    const tokenGroupId = (req as any).user?.groupId ?? (req as any).user?.group_id;
    const roles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const permissions = Array.isArray((req as any).user?.permissions) ? (req as any).user.permissions : [];
    return this.tenancyService.listTenantGroups({
      groupId,
      userGroupId: tokenGroupId,
      roles,
      permissions,
    });
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

  @Permissions("rbac.roles.manage")
  @Post("users")
  createUser(
    @Req() req: Request,
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") headerSubsidiaryId: string | undefined,
    @Headers("x-location-id") headerLocationId: string | undefined,
    @Body() body: CreateAppUserDto,
  ) {
    const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const actorPermissions = Array.isArray((req as any).user?.permissions)
      ? (req as any).user.permissions
      : [];
    const subsidiaryId = body.subsidiary_id ?? headerSubsidiaryId;
    const locationId = body.location_id ?? headerLocationId;

    return this.tenancyService.createAppUser({
      groupId,
      body,
      subsidiaryId,
      locationId,
      actorRoles,
      actorPermissions,
    });
  }

  @Permissions("tenancy.locations.read")
  @Get("locations")
  listLocations(
    @Headers("x-group-id") groupId: string,
    @Query() query: ListLocationsDto,
  ) {
    return this.tenancyService.listLocations(groupId, query);
  }

  @Permissions("tenancy.locations.manage")
  @Post("locations")
  createLocation(
    @Headers("x-group-id") groupId: string,
    @Body() body: CreateLocationDto,
  ) {
    return this.tenancyService.createLocation(groupId, body);
  }

  @Permissions("tenancy.subsidiaries.manage")
  @Post("subsidiaries")
  createSubsidiary(
    @Headers("x-group-id") groupId: string,
    @Body() body: CreateSubsidiaryDto,
  ) {
    return this.tenancyService.createSubsidiary(groupId, body);
  }
}
