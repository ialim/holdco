import { Body, Controller, Get, Headers, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { ComplianceService } from "./compliance.service";
import { CreateCompliancePolicyDto } from "./dto/create-compliance-policy.dto";
import { CreateComplianceTaskDto } from "./dto/create-compliance-task.dto";
import { CreateRiskRegisterItemDto } from "./dto/create-risk-register.dto";
import { CreateComplianceAuditDto } from "./dto/create-compliance-audit.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ComplianceController {
  constructor(private readonly complianceService: ComplianceService) {}

  @Permissions("compliance.policy.manage")
  @Get("compliance/policies")
  listPolicies(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.complianceService.listPolicies(groupId, subsidiaryId, query);
  }

  @Permissions("compliance.policy.manage")
  @Post("compliance/policies")
  createPolicy(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateCompliancePolicyDto,
  ) {
    return this.complianceService.createPolicy(groupId, subsidiaryId, body);
  }

  @Permissions("compliance.task.manage")
  @Get("compliance/tasks")
  listTasks(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.complianceService.listTasks(groupId, subsidiaryId, query);
  }

  @Permissions("compliance.task.manage")
  @Post("compliance/tasks")
  createTask(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateComplianceTaskDto,
  ) {
    return this.complianceService.createTask(groupId, subsidiaryId, body);
  }

  @Permissions("compliance.risk.manage")
  @Get("compliance/risks")
  listRisks(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.complianceService.listRisks(groupId, subsidiaryId, query);
  }

  @Permissions("compliance.risk.manage")
  @Post("compliance/risks")
  createRisk(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateRiskRegisterItemDto,
  ) {
    return this.complianceService.createRisk(groupId, subsidiaryId, body);
  }

  @Permissions("compliance.audit.manage")
  @Get("compliance/audits")
  listAudits(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.complianceService.listAudits(groupId, subsidiaryId, query);
  }

  @Permissions("compliance.audit.manage")
  @Post("compliance/audits")
  createAudit(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateComplianceAuditDto,
  ) {
    return this.complianceService.createAudit(groupId, subsidiaryId, body);
  }
}
