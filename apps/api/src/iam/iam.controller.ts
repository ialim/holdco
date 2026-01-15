import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Param,
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
import { AssignIamRoleDto } from "./dto/assign-iam-role.dto";
import { ListIamUsersDto } from "./dto/list-iam-users.dto";
import { UpdateIamUserAttributesDto } from "./dto/update-iam-user-attributes.dto";
import { KeycloakAdminService } from "./keycloak-admin.service";

const PRIVILEGED_ROLES = new Set(["SUPER_ADMIN", "HOLDCO_ADMIN"]);

function normalizeRoleName(role: string) {
  const normalized = role.trim().toUpperCase().replace(/[^A-Z0-9]+/g, "_");
  return normalized.startsWith("ROLE_") ? normalized.slice(5) : normalized;
}

function isPrivileged(roles: string[], permissions: string[]) {
  if (permissions.includes("*")) return true;
  return roles.map(normalizeRoleName).some((role) => PRIVILEGED_ROLES.has(role));
}

@Controller("v1/iam")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class IamController {
  constructor(private readonly keycloakAdmin: KeycloakAdminService) {}

  @Permissions("rbac.roles.manage")
  @Get("roles")
  async listRoles() {
    return { data: await this.keycloakAdmin.listRoles() };
  }

  @Permissions("rbac.roles.manage")
  @Get("users")
  async listUsers(
    @Req() req: Request,
    @Headers("x-group-id") headerGroupId: string | undefined,
    @Headers("x-subsidiary-id") headerSubsidiaryId: string | undefined,
    @Query() query: ListIamUsersDto,
  ) {
    const limit = query.limit ?? 50;
    const offset = query.offset ?? 0;
    const roles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const permissions = Array.isArray((req as any).user?.permissions)
      ? (req as any).user.permissions
      : [];
    const tokenGroupId = (req as any).user?.groupId ?? (req as any).user?.group_id;
    const tokenSubsidiaryId = (req as any).user?.subsidiaryId ?? (req as any).user?.subsidiary_id;
    const privileged = isPrivileged(roles, permissions);

    const scopeGroupId = privileged ? headerGroupId || tokenGroupId : tokenGroupId;
    const scopeSubsidiaryId = privileged ? headerSubsidiaryId || tokenSubsidiaryId : tokenSubsidiaryId;
    const includeUnscoped = Boolean(query.include_unscoped && privileged);

    if (!privileged && !scopeGroupId) {
      throw new ForbiddenException("Group scope is required for IAM access");
    }

    return this.keycloakAdmin.listUsers({
      limit,
      offset,
      q: query.q,
      scopeGroupId,
      scopeSubsidiaryId,
      includeUnscoped,
    });
  }

  @Permissions("rbac.roles.manage")
  @Post("users/:user_id/roles")
  async assignUserRole(@Param("user_id") userId: string, @Body() body: AssignIamRoleDto, @Req() req: Request) {
    const roles = body.roles?.length ? body.roles : body.role ? [body.role] : [];
    const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const actorPermissions = Array.isArray((req as any).user?.permissions)
      ? (req as any).user.permissions
      : [];
    const privileged = isPrivileged(actorRoles, actorPermissions);
    const scopeGroupId = privileged
      ? undefined
      : (req as any).user?.groupId ?? (req as any).user?.group_id;

    if (!privileged && !scopeGroupId) {
      throw new ForbiddenException("Group scope is required for IAM access");
    }

    return this.keycloakAdmin.assignUserRoles({ userId, roles, scopeGroupId });
  }

  @Permissions("rbac.roles.manage")
  @Post("users/:user_id/attributes")
  async updateUserAttributes(
    @Param("user_id") userId: string,
    @Body() body: UpdateIamUserAttributesDto,
    @Req() req: Request,
  ) {
    const actorRoles = Array.isArray((req as any).user?.roles) ? (req as any).user.roles : [];
    const actorPermissions = Array.isArray((req as any).user?.permissions)
      ? (req as any).user.permissions
      : [];
    const privileged = isPrivileged(actorRoles, actorPermissions);
    const scopeGroupId = privileged
      ? undefined
      : (req as any).user?.groupId ?? (req as any).user?.group_id;

    if (!privileged && !scopeGroupId) {
      throw new ForbiddenException("Group scope is required for IAM access");
    }

    return this.keycloakAdmin.updateUserAttributes({
      userId,
      groupId: body.group_id,
      subsidiaryId: body.subsidiary_id,
      locationId: body.location_id,
      scopeGroupId,
    });
  }
}
