import { Body, Controller, Headers, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { LogisticsWebhookService } from "./logistics.webhook.service";

@Controller("v1/logistics/webhooks")
export class LogisticsWebhookController {
  constructor(private readonly webhookService: LogisticsWebhookService) {}

  @Post(":carrier")
  handleWebhook(
    @Param("carrier") carrier: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const rawBody = typeof (req as any).rawBody === "string" ? (req as any).rawBody : JSON.stringify(body ?? {});
    return this.webhookService.handleWebhook({
      carrier,
      headers,
      payload: body,
      rawBody,
    });
  }
}
