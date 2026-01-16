import { Controller, Get, Headers, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AuditService } from "./audit.service";
import { ListAuditLogLookupDto } from "./dto/list-audit-log-lookup.dto";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Permissions("audit.logs.read")
  @Get("audit-logs")
  listAuditLogs(@Headers("x-group-id") groupId: string, @Query() query: ListAuditLogsDto) {
    return this.auditService.listAuditLogs(groupId, query);
  }

  @Permissions("audit.logs.read")
  @Get("audit-logs/actions")
  listAuditActions(@Headers("x-group-id") groupId: string, @Query() query: ListAuditLogLookupDto) {
    return this.auditService.listAuditActions(groupId, query);
  }

  @Permissions("audit.logs.read")
  @Get("audit-logs/entity-types")
  listAuditEntityTypes(@Headers("x-group-id") groupId: string, @Query() query: ListAuditLogLookupDto) {
    return this.auditService.listAuditEntityTypes(groupId, query);
  }

  @Permissions("audit.logs.read")
  @Get("audit-logs/actors")
  listAuditActors(@Headers("x-group-id") groupId: string, @Query() query: ListAuditLogLookupDto) {
    return this.auditService.listAuditActors(groupId, query);
  }
}
