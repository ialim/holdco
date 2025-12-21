import { Global, Module } from "@nestjs/common";
import { AuthController } from "./auth.controller";
import { JwtAuthMiddleware } from "./jwt-auth.middleware";
import { PermissionsGuard } from "./permissions.guard";

@Global()
@Module({
  controllers: [AuthController],
  providers: [JwtAuthMiddleware, PermissionsGuard],
  exports: [JwtAuthMiddleware, PermissionsGuard],
})
export class AuthModule {}
