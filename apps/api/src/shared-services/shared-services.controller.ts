import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreateServiceRequestDto } from "./dto/create-service-request.dto";
import { CreateThirdPartyDto } from "./dto/create-third-party.dto";
import { ListQueryDto } from "./dto/list-query.dto";
import { ServiceRequestActionDto } from "./dto/service-request-action.dto";
import { ServiceRequestAssignDto } from "./dto/service-request-assign.dto";
import { UpdateThirdPartyDto } from "./dto/update-third-party.dto";
import { SharedServicesService } from "./shared-services.service";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class SharedServicesController {
  constructor(private readonly sharedServicesService: SharedServicesService) {}

  @Permissions("shared_services.third_party.read")
  @Get("third-parties")
  listThirdParties(@Headers("x-group-id") groupId: string, @Query() query: ListQueryDto) {
    return this.sharedServicesService.listThirdParties(groupId, query);
  }

  @Permissions("shared_services.third_party.write")
  @Post("third-parties")
  createThirdParty(@Headers("x-group-id") groupId: string, @Body() body: CreateThirdPartyDto) {
    return this.sharedServicesService.createThirdParty(groupId, body);
  }

  @Permissions("shared_services.third_party.write")
  @Patch("third-parties/:third_party_id")
  updateThirdParty(
    @Headers("x-group-id") groupId: string,
    @Param("third_party_id", new ParseUUIDPipe()) thirdPartyId: string,
    @Body() body: UpdateThirdPartyDto,
  ) {
    return this.sharedServicesService.updateThirdParty(groupId, thirdPartyId, body);
  }

  @Permissions("shared_services.request.read")
  @Get("shared-services/requests")
  listServiceRequests(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.sharedServicesService.listServiceRequests(groupId, subsidiaryId, query);
  }

  @Permissions("shared_services.request.create")
  @Post("shared-services/requests")
  createServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateServiceRequestDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.createServiceRequest(groupId, subsidiaryId, body, actorId);
  }

  @Permissions("shared_services.request.read")
  @Get("shared-services/requests/:service_request_id")
  getServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
  ) {
    return this.sharedServicesService.getServiceRequest(groupId, subsidiaryId, serviceRequestId);
  }

  @Permissions("shared_services.request.approve")
  @Post("shared-services/requests/:service_request_id/approve")
  approveServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.approveServiceRequest(groupId, subsidiaryId, serviceRequestId, body, actorId);
  }

  @Permissions("shared_services.request.reject")
  @Post("shared-services/requests/:service_request_id/reject")
  rejectServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.rejectServiceRequest(groupId, subsidiaryId, serviceRequestId, body, actorId);
  }

  @Permissions("shared_services.request.assign")
  @Post("shared-services/requests/:service_request_id/assign")
  assignServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestAssignDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.assignServiceRequest(groupId, subsidiaryId, serviceRequestId, body, actorId);
  }

  @Permissions("shared_services.request.start")
  @Post("shared-services/requests/:service_request_id/start")
  startServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.startServiceRequest(groupId, subsidiaryId, serviceRequestId, body, actorId);
  }

  @Permissions("shared_services.request.complete")
  @Post("shared-services/requests/:service_request_id/complete")
  completeServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.completeServiceRequest(groupId, subsidiaryId, serviceRequestId, body, actorId);
  }

  @Permissions("shared_services.request.cancel")
  @Post("shared-services/requests/:service_request_id/cancel")
  cancelServiceRequest(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("service_request_id", new ParseUUIDPipe()) serviceRequestId: string,
    @Body() body: ServiceRequestActionDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as string | undefined;
    return this.sharedServicesService.cancelServiceRequest(groupId, subsidiaryId, serviceRequestId, body, actorId);
  }
}
