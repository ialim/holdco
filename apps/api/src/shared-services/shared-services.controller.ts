import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { CreateThirdPartyDto } from "./dto/create-third-party.dto";
import { ListQueryDto } from "./dto/list-query.dto";
import { ServiceRequestActionDto } from "./dto/service-request-action.dto";
import { ServiceRequestAssignDto } from "./dto/service-request-assign.dto";
import { SharedServicesService } from "./shared-services.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class SharedServicesController {
  constructor(private readonly sharedServicesService: SharedServicesService) {}

  @Permissions("shared_services.third_party.read")
  @Get("third-parties")
  listThirdParties(@Query() query: ListQueryDto) {
    return this.sharedServicesService.listThirdParties(query);
  }

  @Permissions("shared_services.third_party.write")
  @Post("third-parties")
  createThirdParty(@Body() body: CreateThirdPartyDto) {
    return this.sharedServicesService.createThirdParty(body);
  }

  @Permissions("shared_services.request.read")
  @Get("shared-services/requests")
  listServiceRequests(@Query() query: ListQueryDto) {
    return this.sharedServicesService.listServiceRequests(query);
  }

  @Permissions("shared_services.request.create")
  @Post("shared-services/requests")
  createServiceRequest(@Body() body: CreateServiceRequestDto) {
    return this.sharedServicesService.createServiceRequest(body);
  }

  @Permissions("shared_services.request.read")
  @Get("shared-services/requests/:service_request_id")
  getServiceRequest(@Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string) {
    return this.sharedServicesService.getServiceRequest(serviceRequestId);
  }

  @Permissions("shared_services.request.approve")
  @Post("shared-services/requests/:service_request_id/approve")
  approveServiceRequest(
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
  ) {
    return this.sharedServicesService.approveServiceRequest(serviceRequestId, body);
  }

  @Permissions("shared_services.request.reject")
  @Post("shared-services/requests/:service_request_id/reject")
  rejectServiceRequest(
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
  ) {
    return this.sharedServicesService.rejectServiceRequest(serviceRequestId, body);
  }

  @Permissions("shared_services.request.assign")
  @Post("shared-services/requests/:service_request_id/assign")
  assignServiceRequest(
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestAssignDto,
  ) {
    return this.sharedServicesService.assignServiceRequest(serviceRequestId, body);
  }

  @Permissions("shared_services.request.start")
  @Post("shared-services/requests/:service_request_id/start")
  startServiceRequest(
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
  ) {
    return this.sharedServicesService.startServiceRequest(serviceRequestId, body);
  }

  @Permissions("shared_services.request.complete")
  @Post("shared-services/requests/:service_request_id/complete")
  completeServiceRequest(
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
  ) {
    return this.sharedServicesService.completeServiceRequest(serviceRequestId, body);
  }

  @Permissions("shared_services.request.cancel")
  @Post("shared-services/requests/:service_request_id/cancel")
  cancelServiceRequest(
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
  ) {
    return this.sharedServicesService.cancelServiceRequest(serviceRequestId, body);
  }
}
