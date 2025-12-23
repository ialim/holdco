import { Body, Controller, Headers, Param, Post, Req } from "@nestjs/common";
import { Request } from "express";
import { PaymentsWebhookService } from "./payments.webhook.service";

@Controller("v1/payments/webhooks")
export class PaymentsWebhookController {
  constructor(private readonly webhookService: PaymentsWebhookService) {}

  @Post(":provider")
  handleWebhook(
    @Param("provider") provider: string,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Body() body: unknown,
    @Req() req: Request,
  ) {
    const rawBody = typeof (req as any).rawBody === "string" ? (req as any).rawBody : JSON.stringify(body ?? {});
    return this.webhookService.handleWebhook({
      provider,
      headers,
      payload: body,
      rawBody,
    });
  }
}
