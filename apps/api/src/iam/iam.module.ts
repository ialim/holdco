import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { IamController } from "./iam.controller";
import { KeycloakAdminService } from "./keycloak-admin.service";

@Module({
  imports: [PrismaModule],
  controllers: [IamController],
  providers: [KeycloakAdminService],
})
export class IamModule {}
