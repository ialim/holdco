import { Controller, Get, Headers, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { AuditService } from "./audit.service";
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
}
