import { Injectable } from "@nestjs/common";
import { FlutterwaveGateway } from "./gateways/flutterwave.gateway";
import { InterswitchGateway } from "./gateways/interswitch.gateway";
import { ManualGateway } from "./gateways/manual.gateway";
import { MonnifyGateway } from "./gateways/monnify.gateway";
import { PaystackGateway } from "./gateways/paystack.gateway";
import { PaymentGateway } from "./gateways/payment-gateway";

@Injectable()
export class PaymentGatewayFactory {
  private readonly gateways: PaymentGateway[];

  constructor(
    private readonly paystack: PaystackGateway,
    private readonly flutterwave: FlutterwaveGateway,
    private readonly monnify: MonnifyGateway,
    private readonly interswitch: InterswitchGateway,
    private readonly manual: ManualGateway,
  ) {
    this.gateways = [paystack, flutterwave, monnify, interswitch, manual];
  }

  get(provider?: string): PaymentGateway {
    const name = (provider || this.defaultProvider()).toLowerCase();
    return this.gateways.find((gateway) => gateway.name === name) ?? this.manual;
  }

  hasProvider(provider?: string) {
    if (!provider) return false;
    const name = provider.toLowerCase();
    return this.gateways.some((gateway) => gateway.name === name);
  }

  defaultProvider() {
    return (process.env.DEFAULT_PAYMENT_PROVIDER ?? "paystack").toLowerCase();
  }

  fallbackProvider() {
    const fallback = process.env.PAYMENT_FALLBACK_PROVIDER;
    return fallback ? fallback.toLowerCase() : undefined;
  }

  fallbackEnabled() {
    return (process.env.PAYMENT_FALLBACK_ENABLED ?? "true").toLowerCase() !== "false";
  }
}
