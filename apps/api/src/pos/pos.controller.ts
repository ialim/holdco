import { Body, Controller, Get, Headers, Param, ParseUUIDPipe, Patch, Post, Query, Req, UseGuards, UsePipes, ValidationPipe } from "@nestjs/common";
import { Request } from "express";
import { Permissions } from "../auth/permissions.decorator";
import { PermissionsGuard } from "../auth/permissions.guard";
import { Public } from "../auth/public.decorator";
import { CreatePosDeviceDto } from "./dto/create-pos-device.dto";
import { UpdatePosDeviceDto } from "./dto/update-pos-device.dto";
import { ListPosDevicesDto } from "./dto/list-pos-devices.dto";
import { ListPosShiftsDto } from "./dto/list-pos-shifts.dto";
import { StartPosShiftDto } from "./dto/start-pos-shift.dto";
import { ClosePosShiftDto } from "./dto/close-pos-shift.dto";
import { PosCashierLoginDto } from "./dto/pos-cashier-login.dto";
import { PosCashierPinDto } from "./dto/pos-cashier-pin.dto";
import { ActivatePosDeviceDto } from "./dto/activate-pos-device.dto";
import { PosService } from "./pos.service";

@Controller("v1/pos")
@UseGuards(PermissionsGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }))
export class PosController {
  constructor(private readonly posService: PosService) {}

  @Permissions("pos.devices.read")
  @Get("devices")
  listDevices(
    @Headers("x-group-id") groupId: string,
    @Query() query: ListPosDevicesDto,
  ) {
    return this.posService.listDevices(groupId, query);
  }

  @Permissions("pos.devices.manage")
  @Post("devices")
  upsertDevice(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-channel") channel: string | undefined,
    @Body() body: CreatePosDeviceDto,
  ) {
    return this.posService.upsertDevice(groupId, subsidiaryId, channel, body);
  }

  @Permissions("pos.devices.manage")
  @Post("devices/activate")
  activateDevice(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string | undefined,
    @Body() body: ActivatePosDeviceDto,
  ) {
    return this.posService.activateDevice(groupId, subsidiaryId, locationId, body);
  }

  @Permissions("pos.devices.manage")
  @Patch("devices/:device_id")
  updateDevice(
    @Headers("x-group-id") groupId: string,
    @Headers("x-channel") channel: string | undefined,
    @Param("device_id") deviceId: string,
    @Body() body: UpdatePosDeviceDto,
  ) {
    return this.posService.updateDevice(groupId, deviceId, channel, body);
  }

  @Public()
  @Post("cashiers/login")
  loginCashier(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Body() body: PosCashierLoginDto,
  ) {
    return this.posService.loginCashier(groupId, subsidiaryId, body);
  }

  @Permissions("pos.cashiers.manage")
  @Patch("cashiers/:user_id/pin")
  setCashierPin(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("user_id", new ParseUUIDPipe()) userId: string,
    @Body() body: PosCashierPinDto,
  ) {
    return this.posService.setCashierPin(groupId, subsidiaryId, userId, body);
  }

  @Permissions("pos.shifts.read")
  @Get("shifts")
  listShifts(
    @Headers("x-group-id") groupId: string,
    @Query() query: ListPosShiftsDto,
  ) {
    return this.posService.listShifts(groupId, query);
  }

  @Permissions("pos.shifts.read")
  @Get("shifts/:shift_id")
  getShift(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("shift_id", new ParseUUIDPipe()) shiftId: string,
  ) {
    return this.posService.getShift(groupId, subsidiaryId, shiftId);
  }

  @Permissions("pos.shifts.manage")
  @Post("shifts")
  startShift(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Headers("x-location-id") locationId: string,
    @Body() body: StartPosShiftDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).cashier?.sub ?? (req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as
      | string
      | undefined;
    return this.posService.startShift(groupId, subsidiaryId, locationId, body, actorId);
  }

  @Permissions("pos.shifts.manage")
  @Post("shifts/:shift_id/close")
  closeShift(
    @Headers("x-group-id") groupId: string,
    @Headers("x-subsidiary-id") subsidiaryId: string,
    @Param("shift_id", new ParseUUIDPipe()) shiftId: string,
    @Body() body: ClosePosShiftDto,
    @Req() req: Request,
  ) {
    const actorId = ((req as any).cashier?.sub ?? (req as any).user?.sub ?? (req as any).user?.id ?? (req as any).user?.userId) as
      | string
      | undefined;
    return this.posService.closeShift(groupId, subsidiaryId, shiftId, body, actorId);
  }
}
