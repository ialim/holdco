import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class MetricsGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const token = process.env.METRICS_TOKEN;
    if (!token) return true;

    const request = context.switchToHttp().getRequest();
    const headerToken = this.readHeader(request.headers?.["x-metrics-token"]);
    const authHeader = this.readHeader(request.headers?.authorization);
    const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice("Bearer ".length) : undefined;

    if (headerToken === token || bearerToken === token) {
      return true;
    }

    throw new UnauthorizedException("Invalid metrics token");
  }

  private readHeader(value: string | string[] | undefined): string | undefined {
    if (!value) return undefined;
    return Array.isArray(value) ? value[0] : value;
  }
}
