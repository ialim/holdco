import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { CreatePaymentProviderConfigDto } from "./dto/create-payment-provider-config.dto";
import { UpdatePaymentProviderConfigDto } from "./dto/update-payment-provider-config.dto";
import { ListPaymentProviderConfigsDto } from "./dto/list-payment-provider-configs.dto";
import { PaymentProviderConfigService } from "./payment-provider-config.service";

@Controller("v1/payments/providers")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PaymentsProviderConfigController {
  constructor(private readonly configService: PaymentProviderConfigService) {}

  @Permissions("payments.config.manage")
  @Get()
  listConfigs(
    @Headers("x-group-id") groupId: string,
    @Query() query: ListPaymentProviderConfigsDto,
  ) {
    return this.configService.listConfigs(groupId, query);
  }

  @Permissions("payments.config.manage")
  @Post()
  upsertConfig(
    @Headers("x-group-id") groupId: string,
    @Body() body: CreatePaymentProviderConfigDto,
  ) {
    return this.configService.upsertConfig(groupId, body);
  }

  @Permissions("payments.config.manage")
  @Patch(":config_id")
  updateConfig(
    @Headers("x-group-id") groupId: string,
    @Param("config_id", new ParseUUIDPipe()) configId: string,
    @Body() body: UpdatePaymentProviderConfigDto,
  ) {
    return this.configService.updateConfig(groupId, configId, body);
  }
}
