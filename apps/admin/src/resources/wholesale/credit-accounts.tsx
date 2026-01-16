"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import {
  Create,
  Datagrid,
  List,
  NumberField,
  NumberInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField as MuiTextField } from "@mui/material";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const statusChoices = [
  { id: "active", name: "active" },
  { id: "inactive", name: "inactive" },
  { id: "suspended", name: "suspended" }
];

const accountFilters = [
  <TextInput key="reseller_id" source="reseller_id" label="Reseller ID" />,
  <SelectInput key="status" source="status" choices={statusChoices} />
];

function CreditLimitButton() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [open, setOpen] = useState(false);
  const [limitAmount, setLimitAmount] = useState("");
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (!open || !record) return;
    setLimitAmount(record.limit_amount != null ? String(record.limit_amount) : "");
    setReason("");
  }, [open, record?.id]);

  const submit = async () => {
    if (!record?.reseller_id) return;
    const parsedLimit = Number(limitAmount);
    if (!Number.isFinite(parsedLimit)) {
      notify("Limit amount is required", { type: "warning" });
      return;
    }
    if (!reason.trim()) {
      notify("Reason is required", { type: "warning" });
      return;
    }

    const response = await apiFetch("/credit-limits", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: {
        reseller_id: record.reseller_id,
        limit_amount: parsedLimit,
        reason: reason.trim()
      }
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Credit limit updated", { type: "success" });
    setOpen(false);
    refresh();
  };

  return (
    <>
      <Button size="small" variant="outlined" onClick={() => setOpen(true)}>
        Update limit
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Update credit limit</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ marginTop: 1 }}>
            <MuiTextField label="Reseller ID" value={record?.reseller_id ?? ""} disabled fullWidth />
            <MuiTextField
              label="Limit amount"
              type="number"
              value={limitAmount}
              onChange={(event) => setLimitAmount(event.target.value)}
              fullWidth
            />
            <MuiTextField
              label="Reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              fullWidth
              multiline
              minRows={3}
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submit}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export function CreditAccountList() {
  const location = useLocation();
  const resellerId = useMemo(() => new URLSearchParams(location.search).get("reseller_id") || "", [location.search]);
  const defaultFilters = resellerId ? { reseller_id: resellerId } : undefined;

  return (
    <List filters={accountFilters} perPage={50} filterDefaultValues={defaultFilters}>
      <Datagrid rowClick={false}>
        <TextField source="reseller_id" label="Reseller ID" />
        <NumberField source="limit_amount" />
        <NumberField source="used_amount" />
        <NumberField source="available_amount" />
        <TextField source="status" />
        <CreditLimitButton />
      </Datagrid>
    </List>
  );
}

export function CreditAccountCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="reseller_id" label="Reseller ID" validate={[required()]} fullWidth />
        <NumberInput source="limit_amount" label="Limit amount" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
