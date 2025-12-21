import { Injectable } from "@nestjs/common";
import { randomUUID } from "crypto";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { CreateThirdPartyDto } from "./dto/create-third-party.dto";
import { ListQueryDto } from "./dto/list-query.dto";
import { ServiceRequestActionDto } from "./dto/service-request-action.dto";
import { ServiceRequestAssignDto } from "./dto/service-request-assign.dto";
import { ServiceRequestPriority, ServiceRequestStatus, ThirdPartyStatus } from "./enums/shared-services.enums";

@Injectable()
export class SharedServicesService {
  listThirdParties(query: ListQueryDto) {
    return { data: [], meta: this.buildMeta(query) };
  }

  createThirdParty(body: CreateThirdPartyDto) {
    return {
      id: randomUUID(),
      status: ThirdPartyStatus.ACTIVE,
      ...body,
    };
  }

  listServiceRequests(query: ListQueryDto) {
    return { data: [], meta: this.buildMeta(query) };
  }

  createServiceRequest(body: CreateServiceRequestDto) {
    return {
      id: randomUUID(),
      status: ServiceRequestStatus.OPEN,
      priority: body.priority ?? ServiceRequestPriority.NORMAL,
      ...body,
    };
  }

  getServiceRequest(serviceRequestId: string) {
    return { id: serviceRequestId };
  }

  approveServiceRequest(serviceRequestId: string, body: ServiceRequestActionDto) {
    return {
      id: serviceRequestId,
      status: ServiceRequestStatus.APPROVED,
      reason: body.reason,
    };
  }

  rejectServiceRequest(serviceRequestId: string, body: ServiceRequestActionDto) {
    return {
      id: serviceRequestId,
      status: ServiceRequestStatus.REJECTED,
      reason: body.reason,
    };
  }

  assignServiceRequest(serviceRequestId: string, body: ServiceRequestAssignDto) {
    return {
      id: serviceRequestId,
      assigned_to: body.assigned_to,
      due_at: body.due_at,
      priority: body.priority,
    };
  }

  startServiceRequest(serviceRequestId: string, body: ServiceRequestActionDto) {
    return {
      id: serviceRequestId,
      status: ServiceRequestStatus.IN_PROGRESS,
      reason: body.reason,
    };
  }

  completeServiceRequest(serviceRequestId: string, body: ServiceRequestActionDto) {
    return {
      id: serviceRequestId,
      status: ServiceRequestStatus.COMPLETED,
      reason: body.reason,
    };
  }

  cancelServiceRequest(serviceRequestId: string, body: ServiceRequestActionDto) {
    return {
      id: serviceRequestId,
      status: ServiceRequestStatus.CANCELLED,
      reason: body.reason,
    };
  }

  private buildMeta(query: ListQueryDto) {
    return {
      limit: query.limit ?? 50,
      offset: query.offset ?? 0,
      total: 0,
    };
  }
}
