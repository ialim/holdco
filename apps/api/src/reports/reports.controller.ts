import { Controller, Get, Headers, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { ReportsService } from "./reports.service";
import { ReportRangeDto } from "./dto/report-range.dto";

@Controller("v1")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Permissions("reports.sales")
  @Get("reports/sales")
  salesReport(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Query() query: ReportRangeDto,
  ) {
    return this.reportsService.salesReport(groupId, subsidiaryId, query);
  }

  @Permissions("reports.inventory")
  @Get("reports/inventory")
  inventoryReport(@Headers("x-group-id") groupId: string, @Headers("x-subsidiary-id") subsidiaryId: string) {
    return this.reportsService.inventoryReport(groupId, subsidiaryId);
  }

  @Permissions("reports.credit")
  @Get("reports/credit")
  creditReport(@Headers("x-group-id") groupId: string, @Headers("x-subsidiary-id") subsidiaryId: string) {
    return this.reportsService.creditReport(groupId, subsidiaryId);
  }
}
