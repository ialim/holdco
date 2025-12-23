import { Injectable } from "@nestjs/common";
import { PaymentGatewayFactory } from "./payment-gateway.factory";

@Injectable()
export class PaymentsReconciliationService {
  constructor(private readonly gatewayFactory: PaymentGatewayFactory) {}

  async reconcile(params: { provider?: string; from?: Date; to?: Date }) {
    const gateway = this.gatewayFactory.get(params.provider);
    if (!gateway.reconcile) {
      return {
        provider: gateway.name,
        status: "skipped",
        message: "Gateway does not support reconciliation.",
      };
    }

    return gateway.reconcile({ from: params.from, to: params.to });
  }
}
