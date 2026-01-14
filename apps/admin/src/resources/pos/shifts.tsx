"use client";

import { useState } from "react";
import {
  Create,
  Datagrid,
  DateField,
  DateInput,
  List,
  NumberField,
  NumberInput,
  SelectInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  useNotify,
  useRecordContext,
  useRefresh,
  required
} from "react-admin";
import { Box, Button, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const statusChoices = [
  { id: "open", name: "open" },
  { id: "closed", name: "closed" }
];

const shiftFilters = [
  <SelectInput key="status" source="status" choices={statusChoices} />,
  <TextInput key="location_id" source="location_id" label="Location ID" />,
  <TextInput key="device_id" source="device_id" label="Device ID" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

function CloseShiftPanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [closingFloat, setClosingFloat] = useState("");
  const [closedById, setClosedById] = useState("");
  const [notes, setNotes] = useState("");

  const closeShift = async () => {
    if (!record?.id) return;
    const payload = {
      closing_float: closingFloat ? Number(closingFloat) : undefined,
      closed_by_id: closedById || undefined,
      notes: notes || undefined
    };

    const response = await apiFetch(`/pos/shifts/${record.id}/close`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: payload
    });

    if (!response.ok) {
      const message =
        (response.data as any)?.message || (response.data as any)?.error || `Close failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Shift closed", { type: "success" });
    refresh();
  };

  if (!record || record.status !== "open") {
    return null;
  }

  return (
    <Box sx={{ border: "1px solid #E3DED3", borderRadius: 2, padding: 2, marginTop: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        Close shift
      </Typography>
      <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
        <MuiTextField
          label="Closing float"
          type="number"
          value={closingFloat}
          onChange={(event) => setClosingFloat(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Closed by (user id)"
          value={closedById}
          onChange={(event) => setClosedById(event.target.value)}
          fullWidth
        />
        <MuiTextField
          label="Notes"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          fullWidth
        />
        <Button variant="contained" onClick={closeShift}>
          Close shift
        </Button>
      </Stack>
    </Box>
  );
}

export function ShiftList() {
  return (
    <List filters={shiftFilters} perPage={50}>
      <Datagrid rowClick="show">
        <TextField source="device_id" />
        <TextField source="location_id" />
        <TextField source="status" />
        <DateField source="opened_at" showTime />
        <DateField source="closed_at" showTime />
        <NumberField source="opening_float" />
        <NumberField source="closing_float" />
      </Datagrid>
    </List>
  );
}

export function ShiftShow() {
  return (
    <Show>
      <SimpleShowLayout sx={{ gap: 2 }}>
        <TextField source="device_id" />
        <TextField source="device_name" />
        <TextField source="status" />
        <TextField source="location_id" />
        <TextField source="opened_by_id" />
        <TextField source="closed_by_id" />
        <DateField source="opened_at" showTime />
        <DateField source="closed_at" showTime />
        <NumberField source="opening_float" />
        <NumberField source="closing_float" />
        <TextField source="notes" />
        <CloseShiftPanel />
      </SimpleShowLayout>
    </Show>
  );
}

export function ShiftCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="location_id" label="Location ID" validate={[required()]} fullWidth />
        <TextInput source="device_id" label="Device ID" validate={[required()]} fullWidth />
        <NumberInput source="opening_float" />
        <TextInput source="opened_by_id" label="Opened by (user id)" fullWidth />
        <TextInput source="notes" multiline minRows={3} fullWidth />
      </SimpleForm>
    </Create>
  );
}
