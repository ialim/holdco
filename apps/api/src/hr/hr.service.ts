import { BadRequestException, Injectable } from "@nestjs/common";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDepartmentDto } from "./dto/create-department.dto";
import { CreatePositionDto } from "./dto/create-position.dto";
import { CreateEmployeeDto } from "./dto/create-employee.dto";
import { CreateLeaveRequestDto } from "./dto/create-leave-request.dto";

@Injectable()
export class HrService {
  constructor(private readonly prisma: PrismaService) {}

  async listDepartments(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, departments] = await this.prisma.$transaction([
      this.prisma.department.count({ where }),
      this.prisma.department.findMany({
        where,
        orderBy: { name: "asc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: departments.map((department: any) => ({
        id: department.id,
        code: department.code ?? undefined,
        name: department.name,
        status: department.status,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createDepartment(groupId: string, subsidiaryId: string, body: CreateDepartmentDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const department = await this.prisma.department.create({
      data: {
        groupId,
        subsidiaryId,
        code: body.code,
        name: body.name,
      },
    });

    return {
      id: department.id,
      code: department.code ?? undefined,
      name: department.name,
      status: department.status,
    };
  }

  async listPositions(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, positions] = await this.prisma.$transaction([
      this.prisma.position.count({ where }),
      this.prisma.position.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: positions.map((position: any) => ({
        id: position.id,
        title: position.title,
        level: position.level ?? undefined,
        status: position.status,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createPosition(groupId: string, subsidiaryId: string, body: CreatePositionDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const position = await this.prisma.position.create({
      data: {
        groupId,
        subsidiaryId,
        title: body.title,
        level: body.level,
      },
    });

    return {
      id: position.id,
      title: position.title,
      level: position.level ?? undefined,
      status: position.status,
    };
  }

  async listEmployees(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, employees] = await this.prisma.$transaction([
      this.prisma.employee.count({ where }),
      this.prisma.employee.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: employees.map((employee: any) => ({
        id: employee.id,
        employee_no: employee.employeeNo,
        user_id: employee.userId ?? undefined,
        department_id: employee.departmentId ?? undefined,
        position_id: employee.positionId ?? undefined,
        status: employee.status,
        hired_at: this.formatDate(employee.hiredAt),
        terminated_at: this.formatDate(employee.terminatedAt),
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createEmployee(groupId: string, subsidiaryId: string, body: CreateEmployeeDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const employee = await this.prisma.employee.create({
      data: {
        groupId,
        subsidiaryId,
        employeeNo: body.employee_no,
        userId: body.user_id,
        departmentId: body.department_id,
        positionId: body.position_id,
        hiredAt: body.hired_at ? new Date(body.hired_at) : undefined,
      },
    });

    return {
      id: employee.id,
      employee_no: employee.employeeNo,
      user_id: employee.userId ?? undefined,
      department_id: employee.departmentId ?? undefined,
      position_id: employee.positionId ?? undefined,
      status: employee.status,
      hired_at: this.formatDate(employee.hiredAt),
      terminated_at: this.formatDate(employee.terminatedAt),
    };
  }

  async listLeaveRequests(groupId: string, subsidiaryId: string, query: ListQueryDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const where = {
      groupId,
      subsidiaryId,
      ...(query.status ? { status: query.status } : {}),
    };

    const [total, requests] = await this.prisma.$transaction([
      this.prisma.leaveRequest.count({ where }),
      this.prisma.leaveRequest.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: query.offset ?? 0,
        take: query.limit ?? 50,
      }),
    ]);

    return {
      data: requests.map((request: any) => ({
        id: request.id,
        employee_id: request.employeeId,
        type: request.type,
        start_date: this.formatDate(request.startDate),
        end_date: this.formatDate(request.endDate),
        status: request.status,
        reason: request.reason ?? undefined,
      })),
      meta: this.buildMeta(query, total),
    };
  }

  async createLeaveRequest(groupId: string, subsidiaryId: string, body: CreateLeaveRequestDto) {
    if (!groupId) throw new BadRequestException("X-Group-Id header is required");
    if (!subsidiaryId) throw new BadRequestException("X-Subsidiary-Id header is required");

    const request = await this.prisma.leaveRequest.create({
      data: {
        groupId,
        subsidiaryId,
        employeeId: body.employee_id,
        type: body.type,
        startDate: new Date(body.start_date),
        endDate: new Date(body.end_date),
        reason: body.reason,
      },
    });

    return {
      id: request.id,
      employee_id: request.employeeId,
      type: request.type,
      start_date: this.formatDate(request.startDate),
      end_date: this.formatDate(request.endDate),
      status: request.status,
      reason: request.reason ?? undefined,
    };
  }

  private buildMeta(query: ListQueryDto, total: number) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total,
    };
  }

  private formatDate(value: Date | null) {
    return value ? value.toISOString().slice(0, 10) : undefined;
  }
}
