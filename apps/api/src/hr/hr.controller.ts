import { Body, Controller, Get, Headers, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { HrService } from "./hr.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { CreatePositionDto } from "./dto/create-position.dto";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class HrController {
  constructor(private readonly hrService: HrService) {}

  @Permissions("hr.department.manage")
  @Get("hr/departments")
  listDepartments(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.hrService.listDepartments(groupId, subsidiaryId, query);
  }

  @Permissions("hr.department.manage")
  @Post("hr/departments")
  createDepartment(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateDepartmentDto,
  ) {
    return this.hrService.createDepartment(groupId, subsidiaryId, body);
  }

  @Permissions("hr.position.manage")
  @Get("hr/positions")
  listPositions(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.hrService.listPositions(groupId, subsidiaryId, query);
  }

  @Permissions("hr.position.manage")
  @Post("hr/positions")
  createPosition(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreatePositionDto,
  ) {
    return this.hrService.createPosition(groupId, subsidiaryId, body);
  }

  @Permissions("hr.employee.manage")
  @Get("hr/employees")
  listEmployees(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.hrService.listEmployees(groupId, subsidiaryId, query);
  }

  @Permissions("hr.employee.manage")
  @Post("hr/employees")
  createEmployee(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateEmployeeDto,
  ) {
    return this.hrService.createEmployee(groupId, subsidiaryId, body);
  }

  @Permissions("hr.leave.manage")
  @Get("hr/leave-requests")
  listLeaveRequests(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.hrService.listLeaveRequests(groupId, subsidiaryId, query);
  }

  @Permissions("hr.leave.manage")
  @Post("hr/leave-requests")
  createLeaveRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateLeaveRequestDto,
  ) {
    return this.hrService.createLeaveRequest(groupId, subsidiaryId, body);
  }
}
