import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AssignUserRoleDto } from "./dto/assign-user-role.dto";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";
import { RolesService } from "./roles.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Permissions("rbac.roles.manage")
  @Get("roles")
  async listRoles(@Headers("x-group-id") groupId: string) {
    return { data: await this.rolesService.listRoles(groupId) };
  }

  @Permissions("rbac.roles.manage")
  @Post("roles")
  createRole(
    @Headers("x-group-id") groupId: string,
    @Body() body: CreateRoleDto,
    @Req() req: Request,
  ) {
    const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const actorPermissions = Array.isArray((req as any).user?.permissions) ? (req as any).user.permissions : [];
    return this.rolesService.createRole({
      groupId,
      name: body.name,
      scope: body.scope,
      permissions: body.permissions,
      actorRoles,
      actorPermissions,
    });
  }

  @Permissions("rbac.roles.manage")
  @Post("roles/:role_id/permissions")
  setRolePermissions(
    @Headers("x-group-id") groupId: string,
    @Param("role_id", new ParseUUIDPipe()) roleId: string,
    @Body() body: UpdateRolePermissionsDto,
    @Req() req: Request,
  ) {
    const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const actorPermissions = Array.isArray((req as any).user?.permissions) ? (req as any).user.permissions : [];
    return this.rolesService.setRolePermissions({
      groupId,
      roleId,
      permissions: body.permissions,
      actorRoles,
      actorPermissions,
    });
  }

  @Permissions("rbac.permissions.read")
  @Get("permissions")
  async listPermissions() {
    return { data: await this.rolesService.listPermissions() };
  }

  @Permissions("rbac.roles.manage")
  @Post("users/:user_id/roles")
  assignUserRole(
    @Headers("x-group-id") groupId: string,
    @Param("user_id", new ParseUUIDPipe()) userId: string,
    @Body() body: AssignUserRoleDto,
    @Req() req: Request,
  ) {
    const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const actorPermissions = Array.isArray((req as any).user?.permissions) ? (req as any).user.permissions : [];
    return this.rolesService.assignUserRole({
      groupId,
      userId,
      roleId: body.role_id,
      subsidiaryId: body.subsidiary_id,
      locationId: body.location_id,
      actorRoles,
      actorPermissions,
    });
  }
}
