"use client";

import {
  Datagrid,
  DateField,
  List,
  NumberField,
  TextField,
  TextInput,
  TopToolbar,
  useListContext,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { Button } from "@mui/material";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const reservationFilters = [
  <TextInput key="status" source="status" label="Status" />,
  <TextInput key="order_id" source="order_id" label="Order ID" />,
  <TextInput key="product_id" source="product_id" label="Product ID" />,
  <TextInput key="variant_id" source="variant_id" label="Variant ID" />,
  <TextInput key="location_id" source="location_id" label="Location ID" />
];

function ReleaseReservationButton() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  const releaseReservation = async () => {
    if (!record?.id) return;
    setLoading(true);
    const response = await apiFetch(`/reservations/${record.id}/release`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() }
    });
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Reservation released", { type: "success" });
    refresh();
  };

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={releaseReservation}
      disabled={loading || record?.status !== "active"}
    >
      Release
    </Button>
  );
}

function ReleaseOrderReservationsButton() {
  const { filterValues } = useListContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);
  const orderId = (filterValues?.order_id as string | undefined)?.trim();

  const release = async () => {
    if (!orderId) {
      notify("Filter by order ID to release all reservations", { type: "warning" });
      return;
    }
    setLoading(true);
    const response = await apiFetch("/reservations/release", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: { order_id: orderId }
    });
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    const released = (response.data as any)?.released ?? 0;
    notify(`Released ${released} reservation(s)`, { type: "success" });
    refresh();
  };

  return (
    <Button variant="outlined" onClick={release} disabled={loading || !orderId}>
      Release order holds
    </Button>
  );
}

function StockReservationActions() {
  return (
    <TopToolbar>
      <ReleaseOrderReservationsButton />
    </TopToolbar>
  );
}

export function StockReservationList() {
  return (
    <List perPage={50} filters={reservationFilters} actions={<StockReservationActions />}>
      <Datagrid rowClick={false}>
        <TextField source="status" />
        <TextField source="order_no" />
        <TextField source="product_name" />
        <TextField source="product_sku" />
        <TextField source="variant_label" />
        <TextField source="location_name" />
        <NumberField source="quantity" />
        <DateField source="created_at" showTime />
        <ReleaseReservationButton />
      </Datagrid>
    </List>
  );
}
