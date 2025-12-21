import { Body, Controller, Get, Headers, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ListQueryDto } from "../common/dto/list-query.dto";
import { AdvisoryService } from "./advisory.service";
import { CreateAdvisoryEngagementDto } from "./dto/create-advisory-engagement.dto";
import { CreateAdvisoryDeliverableDto } from "./dto/create-advisory-deliverable.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class AdvisoryController {
  constructor(private readonly advisoryService: AdvisoryService) {}

  @Permissions("advisory.engagement.manage")
  @Get("advisory/engagements")
  listEngagements(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.advisoryService.listEngagements(groupId, subsidiaryId, query);
  }

  @Permissions("advisory.engagement.manage")
  @Post("advisory/engagements")
  createEngagement(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateAdvisoryEngagementDto,
  ) {
    return this.advisoryService.createEngagement(groupId, subsidiaryId, body);
  }

  @Permissions("advisory.deliverable.manage")
  @Get("advisory/deliverables")
  listDeliverables(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ListQueryDto,
  ) {
    return this.advisoryService.listDeliverables(groupId, subsidiaryId, query);
  }

  @Permissions("advisory.deliverable.manage")
  @Post("advisory/deliverables")
  createDeliverable(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: CreateAdvisoryDeliverableDto,
  ) {
    return this.advisoryService.createDeliverable(groupId, subsidiaryId, body);
  }
}
