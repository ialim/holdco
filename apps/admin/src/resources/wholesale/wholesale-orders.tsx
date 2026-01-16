"use client";

import { useState } from "react";
import {
  ArrayInput,
  Create,
  Datagrid,
  DateInput,
  List,
  NumberField,
  NumberInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  required,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { Button } from "@mui/material";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const orderFilters = [
  <TextInput key="reseller_id" source="reseller_id" label="Reseller ID" />,
  <TextInput key="status" source="status" label="Status" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

function FulfillWholesaleButton() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  const fulfill = async () => {
    if (!record?.id) return;
    setLoading(true);
    const response = await apiFetch(`/adapters/wholesale/orders/${record.id}/fulfill`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() }
    });
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Wholesale order fulfilled", { type: "success" });
    refresh();
  };

  return (
    <Button size="small" variant="outlined" onClick={fulfill} disabled={loading || record?.status === "fulfilled"}>
      Fulfill
    </Button>
  );
}

export function WholesaleOrderList() {
  return (
    <List filters={orderFilters} perPage={50}>
      <Datagrid rowClick="show">
        <TextField source="order_no" label="Order No" />
        <TextField source="reseller_id" />
        <TextField source="status" />
        <TextField source="payment_status" />
        <NumberField source="total_amount" />
        <NumberField source="paid_amount" />
        <NumberField source="balance_due" />
        <TextField source="currency" />
        <FulfillWholesaleButton />
      </Datagrid>
    </List>
  );
}

export function WholesaleOrderCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="reseller_id" label="Reseller ID" validate={[required()]} fullWidth />
        <TextInput source="currency" defaultValue="NGN" fullWidth />
        <NumberInput source="discount_amount" fullWidth />
        <NumberInput source="tax_amount" fullWidth />
        <NumberInput source="shipping_amount" fullWidth />
        <ArrayInput source="items">
          <SimpleFormIterator inline>
            <TextInput source="product_id" validate={[required()]} />
            <TextInput source="variant_id" />
            <NumberInput source="quantity" validate={[required()]} />
            <NumberInput source="unit_price" />
          </SimpleFormIterator>
        </ArrayInput>
        <TextInput source="notes" multiline minRows={3} fullWidth />
      </SimpleForm>
    </Create>
  );
}
