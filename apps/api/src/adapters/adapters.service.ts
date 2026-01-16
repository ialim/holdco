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

const PAYMENT_INTENT_METHODS = new Set(["card", "transfer", "ussd"] as const);
type PaymentIntentMethod = "card" | "transfer" | "ussd";
const isPaymentIntentMethod = (method: string): method is PaymentIntentMethod =>
  PAYMENT_INTENT_METHODS.has(method as PaymentIntentMethod);

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
    allowCreditOverride?: boolean;
  }) {
    let creditAmount = 0;
    if (params.body.reseller_id) {
      const itemsTotal = params.body.items.reduce((sum, item) => {
        const unitPrice = item.unit_price ?? 0;
        return sum + unitPrice * item.quantity;
      }, 0);
      const discountAmount = params.body.discount_amount ?? 0;
      const taxAmount = params.body.tax_amount ?? 0;
      const shippingAmount = params.body.shipping_amount ?? 0;
      const totalAmount = itemsTotal - discountAmount + taxAmount + shippingAmount;
      creditAmount = totalAmount;

      if (totalAmount < 0) {
        throw new BadRequestException("Order total cannot be negative");
      }

      await this.creditService.reserveCreditUsage({
        groupId: params.groupId,
        subsidiaryId: params.subsidiaryId,
        resellerId: params.body.reseller_id,
        amount: totalAmount,
        allowOverride: params.allowCreditOverride,
      });
    }

    try {
      return await this.ordersService.createOrder(
        params.groupId,
        params.subsidiaryId,
        params.locationId,
        "wholesale",
        params.body,
      );
    } catch (error) {
      if (params.body.reseller_id) {
        try {
          await this.creditService.releaseCreditUsage({
            groupId: params.groupId,
            subsidiaryId: params.subsidiaryId,
            resellerId: params.body.reseller_id,
            amount: creditAmount,
          });
        } catch {
          // ignore credit rollback errors
        }
      }
      throw error;
    }
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
    const paymentIntents: any[] = [];
    const capturedPayments: any[] = [];
    const orderPayments: any[] = [];
    let loyalty: any;
    let loyaltyRedemption: any;
    let finalOrder = order;

    try {
      const reserveStock = params.body.reserve_stock ?? params.channel === "retail";
      reservations = reserveStock
        ? await this.reserveStock(params.groupId, params.subsidiaryId, params.locationId, order)
        : [];

      const payments = this.normalizePayments(params.body);
      const paymentPlan = params.body.payment_plan ?? (payments.length > 1 ? "split" : "full");
      const releaseOnPartial = params.body.release_on_partial ?? paymentPlan === "deposit";

      if (payments.length) {
        for (const payment of payments) {
          const amount =
            payment.amount ?? (payments.length === 1 ? Number(order.total_amount) : undefined);
          if (!amount || amount <= 0) {
            throw new BadRequestException("Payment amount is required");
          }
          const currency = payment.currency ?? order.currency;
          const paymentType = payment.paymentType ?? paymentPlan;
          const method = payment.method;

          if (method === "cash") {
            const recorded = await this.ordersService.recordOrderPayment({
              groupId: params.groupId,
              subsidiaryId: params.subsidiaryId,
              orderId: order.id,
              amount,
              currency,
              method,
              status: "captured",
              provider: "manual",
              paymentType,
            });
            orderPayments.push(recorded.payment);
            finalOrder = recorded.order;
            continue;
          }

          if (method === "points") {
            if (!order.customer_id) {
              throw new BadRequestException("Customer is required for points redemption");
            }
            if (!payment.points || payment.points <= 0) {
              throw new BadRequestException("Points amount is required for redemption");
            }
            loyaltyRedemption = await this.loyaltyService.redeemPoints(params.groupId, params.subsidiaryId, {
              customer_id: order.customer_id,
              points: payment.points,
              reason: "POS redemption",
            });
            const recorded = await this.ordersService.recordOrderPayment({
              groupId: params.groupId,
              subsidiaryId: params.subsidiaryId,
              orderId: order.id,
              amount,
              currency,
              method,
              status: "captured",
              provider: "loyalty",
              paymentType,
              pointsRedeemed: payment.points,
            });
            orderPayments.push(recorded.payment);
            finalOrder = recorded.order;
            continue;
          }

          if (!isPaymentIntentMethod(method)) {
            throw new BadRequestException(`Unsupported payment method for online processing: ${method}`);
          }

          paymentIntent = await this.paymentsService.createPaymentIntent(params.groupId, params.subsidiaryId, {
            order_id: order.id,
            amount,
            currency,
            provider: payment.provider,
            capture_method: payment.captureMethod,
            payment_method: method,
            customer_email: payment.customerEmail ?? params.body.payment?.customer_email,
            terminal_serial: payment.terminalSerial,
            transaction_type: payment.transactionType,
          });
          paymentIntents.push(paymentIntent);

          const capture =
            payment.capturePayment ??
            (payment.captureMethod ? payment.captureMethod === "automatic" : params.body.capture_payment);
          if (capture) {
            capturedPayment = await this.paymentsService.capturePaymentIntent(
              params.groupId,
              params.subsidiaryId,
              paymentIntent.id,
            );
            capturedPayments.push(capturedPayment);
          }

          const status = capturedPayment?.status ?? paymentIntent.status ?? "requires_capture";
          const recorded = await this.ordersService.recordOrderPayment({
            groupId: params.groupId,
            subsidiaryId: params.subsidiaryId,
            orderId: order.id,
            amount,
            currency,
            method,
            status,
            provider: paymentIntent.provider,
            reference: paymentIntent.reference,
            paymentIntentId: paymentIntent.id,
            paymentType,
          });
          orderPayments.push(recorded.payment);
          finalOrder = recorded.order;
        }
      }

      if (params.body.loyalty) {
        loyalty = await this.loyaltyService.issuePoints(params.groupId, params.subsidiaryId, {
          customer_id: params.body.loyalty.customer_id,
          points: params.body.loyalty.points,
          reason: params.body.loyalty.reason,
        });
      }

      const paidAmount = Number(finalOrder?.paid_amount ?? 0);
      const shouldFulfill =
        params.channel === "retail" &&
        (!payments.length ||
          paidAmount >= Number(finalOrder.total_amount) ||
          (releaseOnPartial && paidAmount > 0));

      if (shouldFulfill) {
        finalOrder = await this.ordersService.fulfillOrder(params.groupId, params.subsidiaryId, order.id);
      }

      return {
        order: finalOrder,
        reservations,
        payment_intent: paymentIntent,
        payment_intents: paymentIntents.length ? paymentIntents : undefined,
        captured_payment: capturedPayment,
        captured_payments: capturedPayments.length ? capturedPayments : undefined,
        order_payments: orderPayments.length ? orderPayments : undefined,
        loyalty,
        loyalty_redemption: loyaltyRedemption,
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

  private normalizePayments(body: AdapterCheckoutDto) {
    const payments: Array<{
      method: string;
      amount?: number;
      currency?: string;
      provider?: string;
      captureMethod?: string;
      capturePayment?: boolean;
      paymentType?: string;
      points?: number;
      customerEmail?: string;
      terminalSerial?: string;
      transactionType?: string;
    }> = [];

    if (Array.isArray(body.payments) && body.payments.length) {
      for (const payment of body.payments) {
        const method = payment.method ?? payment.payment_method;
        if (!method) {
          throw new BadRequestException("Payment method is required");
        }
        payments.push({
          method,
          amount: payment.amount,
          currency: payment.currency,
          provider: payment.provider,
          captureMethod: payment.capture_method,
          paymentType: payment.payment_type,
          points: payment.points,
          customerEmail: payment.customer_email,
          terminalSerial: payment.terminal_serial,
          transactionType: payment.transaction_type,
        });
      }
      return payments;
    }

    if (body.payment) {
      const method = body.payment.method ?? body.payment.payment_method ?? "card";
      payments.push({
        method,
        amount: body.payment.amount,
        currency: body.payment.currency,
        provider: body.payment.provider,
        captureMethod: body.payment.capture_method,
        paymentType: body.payment.payment_type,
        points: body.payment.points,
        customerEmail: body.payment.customer_email,
        terminalSerial: body.payment.terminal_serial,
        transactionType: body.payment.transaction_type,
      });
    }

    return payments;
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
