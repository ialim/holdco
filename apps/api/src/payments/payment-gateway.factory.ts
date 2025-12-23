import { Injectable } from "@nestjs/common";
import { FlutterwaveGateway } from "./gateways/flutterwave.gateway";
import { ManualGateway } from "./gateways/manual.gateway";
import { PaystackGateway } from "./gateways/paystack.gateway";
import { PaymentGateway } from "./gateways/payment-gateway";

@Injectable()
export class PaymentGatewayFactory {
  private readonly gateways: PaymentGateway[];

  constructor(
    private readonly paystack: PaystackGateway,
    private readonly flutterwave: FlutterwaveGateway,
    private readonly manual: ManualGateway,
  ) {
    this.gateways = [paystack, flutterwave, manual];
  }

  get(provider?: string): PaymentGateway {
    const name = (provider || this.defaultProvider()).toLowerCase();
    return this.gateways.find((gateway) => gateway.name === name) ?? this.manual;
  }

  defaultProvider() {
    return (process.env.DEFAULT_PAYMENT_PROVIDER ?? "paystack").toLowerCase();
  }
}
