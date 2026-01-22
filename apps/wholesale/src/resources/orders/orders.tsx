"use client";

import { useEffect, useMemo, useState } from "react";
import {
  ArrayField,
  Datagrid,
  DateInput,
  FunctionField,
  List,
  NumberField,
  SelectInput,
  Show,
  SimpleShowLayout,
  TextField,
  TextInput,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { Box, Button, MenuItem, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const statusChoices = [
  { id: "pending", name: "pending" },
  { id: "fulfilled", name: "fulfilled" },
  { id: "cancelled", name: "cancelled" }
];

const paymentMethodChoices = [
  { id: "card", name: "card" },
  { id: "transfer", name: "transfer" },
  { id: "ussd", name: "ussd" }
];

const orderFilters = [
  <SelectInput key="status" source="status" choices={statusChoices} alwaysOn />,
  <TextInput key="channel" source="channel" label="Channel" />,
  <TextInput key="location_id" source="location_id" label="Location ID" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

function formatError(data: any, status: number) {
  if (!data) return `Request failed (${status})`;
  if (typeof data === "string") return data;
  const message = data.message || data.error || `Request failed (${status})`;
  const details = data.details ? `: ${data.details}` : "";
  return `${message}${details}`;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ border: "1px solid #e0e0e0", borderRadius: 1, padding: 2, marginTop: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function PaymentIntentPanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("");
  const [provider, setProvider] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [captureMethod, setCaptureMethod] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [paymentIntentId, setPaymentIntentId] = useState("");

  useEffect(() => {
    if (!record) return;
    const nextAmount = record.balance_due ?? record.total_amount ?? "";
    setAmount(nextAmount ? String(nextAmount) : "");
    setCurrency(record.currency ?? "");
  }, [record?.id]);

  const createIntent = async () => {
    if (!record?.id) return;
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount)) {
      notify("Amount is required", { type: "warning" });
      return;
    }

    const response = await apiFetch("/payments/intents", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        order_id: record.id,
        amount: parsedAmount,
        currency: currency ? currency.toUpperCase() : "NGN",
        provider: provider || undefined,
        capture_method: captureMethod || undefined,
        payment_method: paymentMethod || undefined,
        customer_email: customerEmail || undefined
      }
    });

    if (!response.ok) {
      notify(formatError(response.data, response.status), { type: "error" });
      return;
    }

    const intent = (response.data as any)?.data ?? response.data;
    setPaymentIntentId(intent?.id ?? "");
    notify("Payment intent created", { type: "success" });
    refresh();
  };

  const captureIntent = async () => {
    if (!paymentIntentId) {
      notify("Payment intent ID is required", { type: "warning" });
      return;
    }
    const response = await apiFetch(`/payments/${paymentIntentId}/capture`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() }
    });

    if (!response.ok) {
      notify(formatError(response.data, response.status), { type: "error" });
      return;
    }

    notify("Payment captured", { type: "success" });
    refresh();
  };

  return (
    <Section title="Payment intent">
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Currency"
          value={currency}
          onChange={(event) => setCurrency(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Provider"
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          fullWidth
        />
      </Stack>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <MuiTextField
          label="Capture method"
          value={captureMethod}
          onChange={(event) => setCaptureMethod(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Payment method"
          select
          value={paymentMethod}
          onChange={(event) => setPaymentMethod(event.target.value)}
          fullWidth
        >
          <MenuItem value="">(optional)</MenuItem>
          {paymentMethodChoices.map((choice) => (
            <MenuItem key={choice.id} value={choice.id}>
              {choice.name}
            </MenuItem>
          ))}
        </MuiTextField>
        <MuiTextField
          label="Customer email"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          fullWidth
        />
      </Stack>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
        <Button variant="contained" onClick={createIntent}>
          Create intent
        </Button>
        <MuiTextField
          label="Payment intent ID"
          value={paymentIntentId}
          onChange={(event) => setPaymentIntentId(event.target.value)}
          fullWidth
        />
        <Button variant="outlined" onClick={captureIntent}>
          Capture
        </Button>
      </Stack>
    </Section>
  );
}

function RefundPanel() {
  const notify = useNotify();
  const refresh = useRefresh();
  const [paymentId, setPaymentId] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  const submitRefund = async () => {
    const parsedAmount = Number(amount);
    if (!paymentId) {
      notify("Payment ID is required", { type: "warning" });
      return;
    }
    if (!Number.isFinite(parsedAmount)) {
      notify("Amount is required", { type: "warning" });
      return;
    }

    const response = await apiFetch("/refunds", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        payment_id: paymentId,
        amount: parsedAmount,
        reason: reason || undefined
      }
    });

    if (!response.ok) {
      notify(formatError(response.data, response.status), { type: "error" });
      return;
    }

    notify("Refund created", { type: "success" });
    refresh();
  };

  return (
    <Section title="Refund">
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Payment ID"
          value={paymentId}
          onChange={(event) => setPaymentId(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Amount"
          type="number"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Reason"
          value={reason}
          onChange={(event) => setReason(event.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={submitRefund}>
          Create refund
        </Button>
      </Stack>
    </Section>
  );
}

function ReconcilePanel() {
  const notify = useNotify();
  const [provider, setProvider] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const submitReconcile = async () => {
    const response = await apiFetch("/payments/reconcile", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        provider: provider || undefined,
        from: from || undefined,
        to: to || undefined
      }
    });

    if (!response.ok) {
      notify(formatError(response.data, response.status), { type: "error" });
      return;
    }

    notify("Reconciliation queued", { type: "success" });
  };

  return (
    <Section title="Reconcile payments">
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Provider"
          value={provider}
          onChange={(event) => setProvider(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="From (YYYY-MM-DD)"
          value={from}
          onChange={(event) => setFrom(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="To (YYYY-MM-DD)"
          value={to}
          onChange={(event) => setTo(event.target.value)}
          fullWidth
        />
        <Button variant="outlined" onClick={submitReconcile}>
          Run reconcile
        </Button>
      </Stack>
    </Section>
  );
}

export function OrdersList() {
  return (
    <List filters={orderFilters} perPage={50}>
      <Datagrid rowClick="show">
        <TextField source="order_no" label="Order No" />
        <TextField source="status" />
        <TextField source="payment_status" />
        <NumberField source="total_amount" />
        <NumberField source="paid_amount" />
        <NumberField source="balance_due" />
        <TextField source="currency" />
      </Datagrid>
    </List>
  );
}

export function OrderShow() {
  const showTitle = useMemo(() => "Order", []);
  return (
    <Show title={showTitle}>
      <SimpleShowLayout sx={{ gap: 2 }}>
        <TextField source="order_no" label="Order No" />
        <TextField source="status" />
        <TextField source="payment_status" />
        <NumberField source="total_amount" />
        <NumberField source="discount_amount" />
        <NumberField source="tax_amount" />
        <NumberField source="shipping_amount" />
        <NumberField source="paid_amount" />
        <NumberField source="balance_due" />
        <TextField source="currency" />
        <TextField source="customer_id" />
        <FunctionField
          label="Reseller"
          render={(record: any) => record?.reseller_name || record?.reseller_id || "-"}
        />
        <ArrayField source="items">
          <Datagrid>
            <FunctionField
              label="Product"
              render={(line: any) =>
                line?.product_name ? `${line.product_name} (${line.product_sku ?? line.product_id})` : line?.product_id || "-"
              }
            />
            <FunctionField
              label="Variant"
              render={(line: any) => line?.variant_label || line?.variant_id || "-"}
            />
            <NumberField source="quantity" />
            <NumberField source="unit_price" />
            <NumberField source="total_price" />
          </Datagrid>
        </ArrayField>
        <PaymentIntentPanel />
        <RefundPanel />
        <ReconcilePanel />
      </SimpleShowLayout>
    </Show>
  );
}
