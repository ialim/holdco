import { Module } from "@nestjs/common";
import { SharedServicesController } from "./shared-services.controller";
import { SharedServicesService } from "./shared-services.service";

@Module({
  controllers: [SharedServicesController],
  providers: [SharedServicesService],
})
export class SharedServicesModule {}
