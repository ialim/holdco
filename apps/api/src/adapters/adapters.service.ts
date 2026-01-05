import { BadRequestException, Injectable } from "@nestjs/common";
import { OrdersService } from "../orders/orders.service";
import { InventoryService } from "../inventory/inventory.service";
import { PaymentsService } from "../payments/payments.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { CreditService } from "../credit/credit.service";
import { ProcurementService } from "../procurement/procurement.service";
import { AdapterCheckoutDto } from "./dto/adapter-checkout.dto";
import { ResellerOnboardDto } from "./dto/reseller-onboard.dto";
import { CreateOrderDto } from "../orders/dto/create-order.dto";
import { CreateRepaymentDto } from "../credit/dto/create-repayment.dto";
import { AddImportCostsDto } from "../procurement/dto/add-import-costs.dto";
import { CreateImportShipmentDto } from "../procurement/dto/create-import-shipment.dto";
import { ReceiveImportShipmentDto } from "../procurement/dto/receive-import-shipment.dto";
import { ListQueryDto } from "../common/dto/list-query.dto";

type CheckoutParams = {
  groupId: string;
  subsidiaryId: string;
  locationId?: string;
  channel: string;
  body: AdapterCheckoutDto;
};

@Injectable()
export class AdaptersService {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly inventoryService: InventoryService,
    private readonly paymentsService: PaymentsService,
    private readonly loyaltyService: LoyaltyService,
    private readonly creditService: CreditService,
    private readonly procurementService: ProcurementService,
  ) {}

  async createWholesaleOrder(params: {
    groupId: string;
    subsidiaryId: string;
    locationId?: string;
    body: CreateOrderDto;
  }) {
    return this.ordersService.createOrder(
      params.groupId,
      params.subsidiaryId,
      params.locationId,
      "wholesale",
      params.body,
    );
  }

  async fulfillWholesaleOrder(params: { groupId: string; subsidiaryId: string; orderId: string }) {
    return this.ordersService.fulfillOrder(params.groupId, params.subsidiaryId, params.orderId);
  }

  async retailCheckout(params: { groupId: string; subsidiaryId: string; locationId?: string; body: AdapterCheckoutDto }) {
    if (!params.locationId) {
      throw new BadRequestException("X-Location-Id header is required");
    }
    return this.checkout({
      groupId: params.groupId,
      subsidiaryId: params.subsidiaryId,
      locationId: params.locationId,
      channel: "retail",
      body: params.body,
    });
  }

  async digitalCheckout(params: { groupId: string; subsidiaryId: string; locationId?: string; body: AdapterCheckoutDto }) {
    return this.checkout({
      groupId: params.groupId,
      subsidiaryId: params.subsidiaryId,
      locationId: params.locationId,
      channel: "digital",
      body: params.body,
    });
  }

  async onboardReseller(params: { groupId: string; subsidiaryId: string; body: ResellerOnboardDto }) {
    const reseller = await this.creditService.createReseller(params.groupId, params.subsidiaryId, {
      name: params.body.reseller.name,
      status: params.body.reseller.status,
    });

    const creditAccount = await this.creditService.createCreditAccount(params.groupId, params.subsidiaryId, {
      reseller_id: reseller.id,
      limit_amount: params.body.credit.limit_amount,
    });

    return {
      reseller,
      credit_account: creditAccount,
    };
  }

  async recordResellerRepayment(params: { groupId: string; subsidiaryId: string; body: CreateRepaymentDto }) {
    return this.creditService.createRepayment(params.groupId, params.subsidiaryId, params.body);
  }

  async listTradingImportShipments(params: { groupId: string; subsidiaryId: string; query: ListQueryDto }) {
    return this.procurementService.listImportShipments(params.groupId, params.subsidiaryId, params.query);
  }

  async createTradingImportShipment(params: { groupId: string; subsidiaryId: string; body: CreateImportShipmentDto }) {
    return this.procurementService.createImportShipment(params.groupId, params.subsidiaryId, params.body);
  }

  async addTradingImportCosts(params: { groupId: string; subsidiaryId: string; shipmentId: string; body: AddImportCostsDto }) {
    return this.procurementService.addImportCosts(params.groupId, params.subsidiaryId, params.shipmentId, params.body);
  }

  async finalizeTradingImportShipment(params: { groupId: string; subsidiaryId: string; shipmentId: string }) {
    return this.procurementService.finalizeImportShipment(params.groupId, params.subsidiaryId, params.shipmentId);
  }

  async receiveTradingImportShipment(params: { groupId: string; subsidiaryId: string; shipmentId: string; body: ReceiveImportShipmentDto }) {
    return this.procurementService.receiveImportShipment(params.groupId, params.subsidiaryId, params.shipmentId, params.body);
  }

  private async checkout(params: CheckoutParams) {
    const order = await this.ordersService.createOrder(
      params.groupId,
      params.subsidiaryId,
      params.locationId,
      params.channel,
      params.body.order,
    );

    let reservations: any[] = [];
    let paymentIntent: any;
    let capturedPayment: any;
    let loyalty: any;

    try {
      const reserveStock = params.body.reserve_stock ?? params.channel === "retail";
      reservations = reserveStock
        ? await this.reserveStock(params.groupId, params.subsidiaryId, params.locationId, order)
        : [];

      if (params.body.payment) {
        const amount = params.body.payment.amount ?? order.total_amount;
        const currency = params.body.payment.currency ?? order.currency;
        paymentIntent = await this.paymentsService.createPaymentIntent(params.groupId, params.subsidiaryId, {
          order_id: order.id,
          amount,
          currency,
          provider: params.body.payment.provider,
          capture_method: params.body.payment.capture_method,
          payment_method: params.body.payment.payment_method,
          customer_email: params.body.payment.customer_email,
        });

        if (params.body.capture_payment) {
          capturedPayment = await this.paymentsService.capturePaymentIntent(
            params.groupId,
            params.subsidiaryId,
            paymentIntent.id,
          );
        }
      }

      if (params.body.loyalty) {
        loyalty = await this.loyaltyService.issuePoints(params.groupId, params.subsidiaryId, {
          customer_id: params.body.loyalty.customer_id,
          points: params.body.loyalty.points,
          reason: params.body.loyalty.reason,
        });
      }

      return {
        order,
        reservations,
        payment_intent: paymentIntent,
        captured_payment: capturedPayment,
        loyalty,
      };
    } catch (error) {
      if (reservations.length) {
        try {
          await this.inventoryService.releaseStockReservations(
            params.groupId,
            params.subsidiaryId,
            reservations.map((reservation) => reservation.id),
          );
        } catch {
          // ignore cleanup errors to preserve original failure
        }
      }

      try {
        await this.ordersService.cancelOrder(params.groupId, params.subsidiaryId, order.id);
      } catch {
        // ignore cleanup errors to preserve original failure
      }

      throw error;
    }
  }

  private async reserveStock(
    groupId: string,
    subsidiaryId: string,
    locationId: string | undefined,
    order: { id: string; items: Array<{ product_id: string; variant_id?: string; quantity: number }> },
  ) {
    if (!locationId) {
      throw new BadRequestException("X-Location-Id header is required for stock reservation");
    }

    const reservations = await Promise.all(
      order.items.map((item) =>
        this.inventoryService.createStockReservation(groupId, subsidiaryId, locationId, {
          order_id: order.id,
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
        }),
      ),
    );

    return reservations;
  }
}
