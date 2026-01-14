"use client";

import { Box, Button, MenuItem, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { Datagrid, DateField, List, TextField, TextInput, useNotify, useRecordContext } from "react-admin";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const agreementTypeChoices = [
  { id: "MANAGEMENT", name: "MANAGEMENT" },
  { id: "PRODUCT_SUPPLY", name: "PRODUCT_SUPPLY" },
  { id: "LOGISTICS", name: "LOGISTICS" },
  { id: "IP_LICENSE", name: "IP_LICENSE" }
];

const pricingModelChoices = [
  { id: "COST_PLUS", name: "COST_PLUS" },
  { id: "FIXED_MONTHLY", name: "FIXED_MONTHLY" },
  { id: "ROYALTY_PERCENT", name: "ROYALTY_PERCENT" }
];

const taxTypeChoices = [
  { id: "SERVICES", name: "SERVICES" },
  { id: "GOODS", name: "GOODS" },
  { id: "RENT", name: "RENT" },
  { id: "INTEREST", name: "INTEREST" },
  { id: "ROYALTIES", name: "ROYALTIES" }
];

const booleanChoices = [
  { id: "", name: "(keep)" },
  { id: "true", name: "true" },
  { id: "false", name: "false" }
];

const agreementFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ border: "1px solid #E3DED3", borderRadius: 2, padding: 2, marginTop: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function parseNumber(value: string) {
  if (value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function IntercompanyAgreementsList() {
  return (
    <List filters={agreementFilters} perPage={50}>
      <Datagrid rowClick="expand" expand={<AgreementDetails />}>
        <TextField source="provider_company_name" label="Provider" />
        <TextField source="recipient_company_name" label="Recipient" />
        <TextField source="type" />
        <TextField source="pricing_model" label="Pricing" />
        <TextField source="markup_rate" label="Markup" />
        <TextField source="fixed_fee_amount" label="Fixed fee" />
        <TextField source="vat_applies" label="VAT" />
        <TextField source="vat_rate" label="VAT rate" />
        <TextField source="wht_applies" label="WHT" />
        <TextField source="wht_rate" label="WHT rate" />
        <DateField source="effective_from" label="Effective from" />
        <DateField source="effective_to" label="Effective to" />
      </Datagrid>
      <IntercompanyAgreementsForm />
    </List>
  );
}

function AgreementDetails() {
  const record = useRecordContext();
  if (!record) return null;
  return (
    <Box sx={{ padding: 2, background: "#FFFDFA", borderRadius: 2, border: "1px solid #E3DED3" }}>
      <Stack spacing={1}>
        <Typography variant="subtitle2">Agreement details</Typography>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Typography variant="body2">ID: {record.id}</Typography>
          <Typography variant="body2">Provider: {record.provider_company_name}</Typography>
          <Typography variant="body2">Recipient: {record.recipient_company_name}</Typography>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Typography variant="body2">Type: {record.type}</Typography>
          <Typography variant="body2">Pricing: {record.pricing_model}</Typography>
          <Typography variant="body2">Markup: {record.markup_rate ?? "-"}</Typography>
          <Typography variant="body2">Fixed fee: {record.fixed_fee_amount ?? "-"}</Typography>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Typography variant="body2">VAT applies: {String(record.vat_applies)}</Typography>
          <Typography variant="body2">VAT rate: {record.vat_rate ?? "-"}</Typography>
          <Typography variant="body2">WHT applies: {String(record.wht_applies)}</Typography>
          <Typography variant="body2">WHT rate: {record.wht_rate ?? "-"}</Typography>
        </Stack>
        <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
          <Typography variant="body2">WHT tax type: {record.wht_tax_type ?? "-"}</Typography>
          <Typography variant="body2">Effective from: {record.effective_from}</Typography>
          <Typography variant="body2">Effective to: {record.effective_to ?? "-"}</Typography>
        </Stack>
      </Stack>
    </Box>
  );
}

function IntercompanyAgreementsForm() {
  const notify = useNotify();
  const [createForm, setCreateForm] = useState({
    provider_company_id: "",
    recipient_company_id: "",
    type: "",
    pricing_model: "",
    markup_rate: "",
    fixed_fee_amount: "",
    vat_applies: false,
    vat_rate: "",
    wht_applies: false,
    wht_rate: "",
    wht_tax_type: "",
    effective_from: "",
    effective_to: ""
  });
  const [updateForm, setUpdateForm] = useState({
    agreement_id: "",
    provider_company_id: "",
    recipient_company_id: "",
    type: "",
    pricing_model: "",
    markup_rate: "",
    fixed_fee_amount: "",
    vat_applies: "",
    vat_rate: "",
    wht_applies: "",
    wht_rate: "",
    wht_tax_type: "",
    effective_from: "",
    effective_to: ""
  });

  const updateCreate = (key: string, value: string | boolean) =>
    setCreateForm((prev) => ({ ...prev, [key]: value }));
  const updateUpdate = (key: string, value: string) => setUpdateForm((prev) => ({ ...prev, [key]: value }));

  const submitCreate = async () => {
    if (!createForm.provider_company_id || !createForm.recipient_company_id) {
      notify("Provider and recipient company ids are required", { type: "warning" });
      return;
    }
    if (!createForm.type || !createForm.pricing_model) {
      notify("Agreement type and pricing model are required", { type: "warning" });
      return;
    }
    if (!createForm.effective_from) {
      notify("Effective from date is required", { type: "warning" });
      return;
    }

    const payload = {
      provider_company_id: createForm.provider_company_id,
      recipient_company_id: createForm.recipient_company_id,
      type: createForm.type,
      pricing_model: createForm.pricing_model,
      markup_rate: parseNumber(createForm.markup_rate),
      fixed_fee_amount: parseNumber(createForm.fixed_fee_amount),
      vat_applies: createForm.vat_applies,
      vat_rate: parseNumber(createForm.vat_rate),
      wht_applies: createForm.wht_applies,
      wht_rate: parseNumber(createForm.wht_rate),
      wht_tax_type: createForm.wht_tax_type || undefined,
      effective_from: createForm.effective_from,
      effective_to: createForm.effective_to || undefined
    };

    const response = await apiFetch("/finance/intercompany-agreements", {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: payload
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Create agreement failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Intercompany agreement created", { type: "success" });
  };

  const submitUpdate = async () => {
    if (!updateForm.agreement_id) {
      notify("Agreement id is required", { type: "warning" });
      return;
    }

    const payload: Record<string, any> = {};
    if (updateForm.provider_company_id) payload.provider_company_id = updateForm.provider_company_id;
    if (updateForm.recipient_company_id) payload.recipient_company_id = updateForm.recipient_company_id;
    if (updateForm.type) payload.type = updateForm.type;
    if (updateForm.pricing_model) payload.pricing_model = updateForm.pricing_model;
    const markupRate = parseNumber(updateForm.markup_rate);
    if (markupRate !== undefined) payload.markup_rate = markupRate;
    const fixedFeeAmount = parseNumber(updateForm.fixed_fee_amount);
    if (fixedFeeAmount !== undefined) payload.fixed_fee_amount = fixedFeeAmount;
    if (updateForm.vat_applies !== "") payload.vat_applies = updateForm.vat_applies === "true";
    const vatRate = parseNumber(updateForm.vat_rate);
    if (vatRate !== undefined) payload.vat_rate = vatRate;
    if (updateForm.wht_applies !== "") payload.wht_applies = updateForm.wht_applies === "true";
    const whtRate = parseNumber(updateForm.wht_rate);
    if (whtRate !== undefined) payload.wht_rate = whtRate;
    if (updateForm.wht_tax_type) payload.wht_tax_type = updateForm.wht_tax_type;
    if (updateForm.effective_from) payload.effective_from = updateForm.effective_from;
    if (updateForm.effective_to) payload.effective_to = updateForm.effective_to;

    if (!Object.keys(payload).length) {
      notify("Add at least one field to update", { type: "warning" });
      return;
    }

    const response = await apiFetch(`/finance/intercompany-agreements/${updateForm.agreement_id}`, {
      method: "PATCH",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: payload
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Update agreement failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Intercompany agreement updated", { type: "success" });
  };

  return (
    <Box sx={{ paddingBottom: 2 }}>
      <Typography variant="h6" sx={{ marginBottom: 1 }}>
        Intercompany agreements
      </Typography>

      <Section title="Create agreement">
        <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
          <MuiTextField
            label="Provider company id"
            value={createForm.provider_company_id}
            onChange={(event) => updateCreate("provider_company_id", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="Recipient company id"
            value={createForm.recipient_company_id}
            onChange={(event) => updateCreate("recipient_company_id", event.target.value)}
            fullWidth
          />
        </Stack>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
          <MuiTextField
            label="Agreement type"
            select
            value={createForm.type}
            onChange={(event) => updateCreate("type", event.target.value)}
            fullWidth
          >
            <MenuItem value="">(select)</MenuItem>
            {agreementTypeChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
          <MuiTextField
            label="Pricing model"
            select
            value={createForm.pricing_model}
            onChange={(event) => updateCreate("pricing_model", event.target.value)}
            fullWidth
          >
            <MenuItem value="">(select)</MenuItem>
            {pricingModelChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
          <MuiTextField
            label="WHT tax type"
            select
            value={createForm.wht_tax_type}
            onChange={(event) => updateCreate("wht_tax_type", event.target.value)}
            fullWidth
          >
            <MenuItem value="">(optional)</MenuItem>
            {taxTypeChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
        </Stack>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
          <MuiTextField
            label="Markup rate"
            type="number"
            value={createForm.markup_rate}
            onChange={(event) => updateCreate("markup_rate", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="Fixed fee amount"
            type="number"
            value={createForm.fixed_fee_amount}
            onChange={(event) => updateCreate("fixed_fee_amount", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="VAT rate"
            type="number"
            value={createForm.vat_rate}
            onChange={(event) => updateCreate("vat_rate", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="WHT rate"
            type="number"
            value={createForm.wht_rate}
            onChange={(event) => updateCreate("wht_rate", event.target.value)}
            fullWidth
          />
        </Stack>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
          <MuiTextField
            label="VAT applies"
            select
            value={createForm.vat_applies ? "true" : "false"}
            onChange={(event) => updateCreate("vat_applies", event.target.value === "true")}
            fullWidth
          >
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
          </MuiTextField>
          <MuiTextField
            label="WHT applies"
            select
            value={createForm.wht_applies ? "true" : "false"}
            onChange={(event) => updateCreate("wht_applies", event.target.value === "true")}
            fullWidth
          >
            <MenuItem value="true">true</MenuItem>
            <MenuItem value="false">false</MenuItem>
          </MuiTextField>
          <MuiTextField
            label="Effective from"
            type="date"
            value={createForm.effective_from}
            onChange={(event) => updateCreate("effective_from", event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <MuiTextField
            label="Effective to"
            type="date"
            value={createForm.effective_to}
            onChange={(event) => updateCreate("effective_to", event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
          <Button variant="contained" onClick={submitCreate}>
            Create agreement
          </Button>
        </Stack>
      </Section>

      <Section title="Update agreement">
        <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
          <MuiTextField
            label="Agreement id"
            value={updateForm.agreement_id}
            onChange={(event) => updateUpdate("agreement_id", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="Provider company id"
            value={updateForm.provider_company_id}
            onChange={(event) => updateUpdate("provider_company_id", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="Recipient company id"
            value={updateForm.recipient_company_id}
            onChange={(event) => updateUpdate("recipient_company_id", event.target.value)}
            fullWidth
          />
        </Stack>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
          <MuiTextField
            label="Agreement type"
            select
            value={updateForm.type}
            onChange={(event) => updateUpdate("type", event.target.value)}
            fullWidth
          >
            <MenuItem value="">(keep)</MenuItem>
            {agreementTypeChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
          <MuiTextField
            label="Pricing model"
            select
            value={updateForm.pricing_model}
            onChange={(event) => updateUpdate("pricing_model", event.target.value)}
            fullWidth
          >
            <MenuItem value="">(keep)</MenuItem>
            {pricingModelChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
          <MuiTextField
            label="WHT tax type"
            select
            value={updateForm.wht_tax_type}
            onChange={(event) => updateUpdate("wht_tax_type", event.target.value)}
            fullWidth
          >
            <MenuItem value="">(keep)</MenuItem>
            {taxTypeChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
        </Stack>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
          <MuiTextField
            label="Markup rate"
            type="number"
            value={updateForm.markup_rate}
            onChange={(event) => updateUpdate("markup_rate", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="Fixed fee amount"
            type="number"
            value={updateForm.fixed_fee_amount}
            onChange={(event) => updateUpdate("fixed_fee_amount", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="VAT rate"
            type="number"
            value={updateForm.vat_rate}
            onChange={(event) => updateUpdate("vat_rate", event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="WHT rate"
            type="number"
            value={updateForm.wht_rate}
            onChange={(event) => updateUpdate("wht_rate", event.target.value)}
            fullWidth
          />
        </Stack>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }} sx={{ marginTop: 2 }}>
          <MuiTextField
            label="VAT applies"
            select
            value={updateForm.vat_applies}
            onChange={(event) => updateUpdate("vat_applies", event.target.value)}
            fullWidth
          >
            {booleanChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
          <MuiTextField
            label="WHT applies"
            select
            value={updateForm.wht_applies}
            onChange={(event) => updateUpdate("wht_applies", event.target.value)}
            fullWidth
          >
            {booleanChoices.map((choice) => (
              <MenuItem key={choice.id} value={choice.id}>
                {choice.name}
              </MenuItem>
            ))}
          </MuiTextField>
          <MuiTextField
            label="Effective from"
            type="date"
            value={updateForm.effective_from}
            onChange={(event) => updateUpdate("effective_from", event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <MuiTextField
            label="Effective to"
            type="date"
            value={updateForm.effective_to}
            onChange={(event) => updateUpdate("effective_to", event.target.value)}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Stack>
        <Stack direction="row" spacing={2} sx={{ marginTop: 2 }}>
          <Button variant="contained" onClick={submitUpdate}>
            Update agreement
          </Button>
        </Stack>
      </Section>
    </Box>
  );
}
