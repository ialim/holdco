"use client";

import { useEffect, useState } from "react";
import {
  ArrayInput,
  ArrayField,
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  DateInput,
  FormDataConsumer,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  Show,
  SimpleForm,
  SimpleFormIterator,
  SimpleShowLayout,
  TextField,
  TextInput,
  useNotify,
  usePermissions,
  useRecordContext,
  useRefresh,
  required
} from "react-admin";
import { Autocomplete, Box, Button, Stack, TextField as MuiTextField, Typography } from "@mui/material";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const shipmentFilters = [
  <TextInput key="status" source="status" label="Status" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

function ActionSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box sx={{ border: "1px solid #E3DED3", borderRadius: 2, padding: 2, marginTop: 2 }}>
      <Typography variant="subtitle1" sx={{ marginBottom: 1 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function AddCostsPanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [costs, setCosts] = useState([{ category: "", amount: "", notes: "" }]);

  const updateCost = (index: number, key: string, value: string) => {
    setCosts((prev) => prev.map((item, idx) => (idx === index ? { ...item, [key]: value } : item)));
  };

  const addLine = () => setCosts((prev) => [...prev, { category: "", amount: "", notes: "" }]);
  const removeLine = (index: number) => setCosts((prev) => prev.filter((_, idx) => idx !== index));

  const submitCosts = async () => {
    if (!record?.id) return;
    const payload = {
      costs: costs
        .filter((line) => line.category && line.amount !== "")
        .map((line) => ({
          category: line.category,
          amount: Number(line.amount),
          notes: line.notes || undefined
        }))
    };
    if (!payload.costs.length) {
      notify("At least one cost line is required", { type: "warning" });
      return;
    }

    const response = await apiFetch(`/procurement/import-shipments/${record.id}/costs`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: payload
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Add costs failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Costs added", { type: "success" });
    refresh();
  };

  return (
    <ActionSection title="Add import costs">
      <Stack spacing={2}>
        {costs.map((line, index) => (
          <Stack key={`${line.category}-${index}`} spacing={1} direction={{ xs: "column", md: "row" }}>
            <MuiTextField
              label="Category"
              value={line.category}
              onChange={(event) => updateCost(index, "category", event.target.value)}
              fullWidth
            />
            <MuiTextField
              label="Amount"
              type="number"
              value={line.amount}
              onChange={(event) => updateCost(index, "amount", event.target.value)}
              fullWidth
            />
            <MuiTextField
              label="Notes"
              value={line.notes}
              onChange={(event) => updateCost(index, "notes", event.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={() => removeLine(index)}>
              Remove
            </Button>
          </Stack>
        ))}
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={addLine}>
            Add line
          </Button>
          <Button variant="contained" onClick={submitCosts}>
            Save costs
          </Button>
        </Stack>
      </Stack>
    </ActionSection>
  );
}

function ReceiveShipmentPanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [locationId, setLocationId] = useState("");
  const [locationOptions, setLocationOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [receivedAt, setReceivedAt] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState([
    { product_id: "", variant_id: "", quantity_received: "", quantity_rejected: "" }
  ]);
  const [productOptions, setProductOptions] = useState<Array<{ id: string; label: string }>>([]);
  const [variantOptionsByProduct, setVariantOptionsByProduct] = useState<Record<string, Array<{ id: string; label: string }>>>(
    {}
  );

  const updateLine = (index: number, key: string, value: string) => {
    setLines((prev) =>
      prev.map((line, idx) =>
        idx === index
          ? {
              ...line,
              [key]: value,
              ...(key === "product_id" ? { variant_id: "" } : {})
            }
          : line
      )
    );
  };

  const addLine = () =>
    setLines((prev) => [...prev, { product_id: "", variant_id: "", quantity_received: "", quantity_rejected: "" }]);
  const removeLine = (index: number) => setLines((prev) => prev.filter((_, idx) => idx !== index));

  const loadLocations = async (query: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (query) params.set("q", query);
    const response = await apiFetch(`/locations?${params.toString()}`);
    if (!response.ok) {
      notify(`Location lookup failed (${response.status})`, { type: "error" });
      return;
    }
    const items = (response.data as any)?.data ?? [];
    const options = Array.isArray(items)
      ? items.map((item: any) => ({
          id: item.id,
          label: item.name ? `${item.name} (${item.id})` : item.id
        }))
      : [];
    setLocationOptions(options);
  };

  const loadProducts = async (query: string) => {
    const params = new URLSearchParams({ limit: "20" });
    if (query) params.set("q", query);
    const response = await apiFetch(`/products?${params.toString()}`);
    if (!response.ok) {
      notify(`Product lookup failed (${response.status})`, { type: "error" });
      return;
    }
    const items = (response.data as any)?.data ?? [];
    const options = Array.isArray(items)
      ? items.map((item: any) => ({
          id: item.id,
          label: item.name ? `${item.name} (${item.sku ?? item.id})` : item.id
        }))
      : [];
    setProductOptions(options);
  };

  const loadVariants = async (productId: string) => {
    if (!productId) return;
    const params = new URLSearchParams({ limit: "50", product_id: productId });
    const response = await apiFetch(`/variants?${params.toString()}`);
    if (!response.ok) {
      notify(`Variant lookup failed (${response.status})`, { type: "error" });
      return;
    }
    const items = (response.data as any)?.data ?? [];
    const options = Array.isArray(items)
      ? items.map((item: any) => ({
          id: item.id,
          label: item.size || item.unit || item.barcode
            ? `${item.size ?? ""}${item.unit ? ` ${item.unit}` : ""}${item.barcode ? ` - ${item.barcode}` : ""}`.trim()
            : item.id
        }))
      : [];
    setVariantOptionsByProduct((prev) => ({ ...prev, [productId]: options }));
  };

  useEffect(() => {
    loadLocations("");
    loadProducts("");
  }, []);

  const submitReceive = async () => {
    if (!record?.id) return;
    if (!locationId) {
      notify("Location ID is required", { type: "warning" });
      return;
    }
    const payload = {
      location_id: locationId,
      received_at: receivedAt || undefined,
      notes: notes || undefined,
      lines: lines
        .filter((line) => line.product_id && line.quantity_received !== "")
        .map((line) => ({
          product_id: line.product_id,
          variant_id: line.variant_id || undefined,
          quantity_received: Number(line.quantity_received),
          quantity_rejected: line.quantity_rejected ? Number(line.quantity_rejected) : undefined
        }))
    };

    if (!payload.lines.length) {
      notify("At least one receive line is required", { type: "warning" });
      return;
    }

    const response = await apiFetch(`/procurement/import-shipments/${record.id}/receive`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() },
      body: payload
    });

    if (!response.ok) {
      const message = (response.data as any)?.message || `Receive failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Shipment received", { type: "success" });
    refresh();
  };

  return (
    <ActionSection title="Receive shipment">
      <Stack spacing={2}>
        <Stack spacing={2} direction={{ xs: "column", md: "row" }}>
          <Autocomplete
            options={locationOptions}
            value={locationOptions.find((option) => option.id === locationId) ?? null}
            onChange={(_, option) => setLocationId(option?.id ?? "")}
            onInputChange={(_, value) => {
              loadLocations(value);
            }}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => <MuiTextField {...params} label="Location" fullWidth />}
          />
          <MuiTextField
            label="Received at (YYYY-MM-DD)"
            value={receivedAt}
            onChange={(event) => setReceivedAt(event.target.value)}
            fullWidth
          />
          <MuiTextField
            label="Notes"
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            fullWidth
          />
        </Stack>
        {lines.map((line, index) => (
          <Stack key={`${line.product_id}-${index}`} spacing={1} direction={{ xs: "column", md: "row" }}>
            <Autocomplete
              options={productOptions}
              value={productOptions.find((option) => option.id === line.product_id) ?? null}
              onChange={(_, option) => {
                updateLine(index, "product_id", option?.id ?? "");
                if (option?.id) {
                  loadVariants(option.id);
                }
              }}
              onInputChange={(_, value) => {
                loadProducts(value);
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => <MuiTextField {...params} label="Product" fullWidth />}
            />
            <Autocomplete
              options={line.product_id ? variantOptionsByProduct[line.product_id] ?? [] : []}
              value={
                line.product_id
                  ? (variantOptionsByProduct[line.product_id] ?? []).find((option) => option.id === line.variant_id) ?? null
                  : null
              }
              onChange={(_, option) => updateLine(index, "variant_id", option?.id ?? "")}
              onOpen={() => {
                if (line.product_id) {
                  loadVariants(line.product_id);
                }
              }}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              renderInput={(params) => (
                <MuiTextField {...params} label="Variant" fullWidth disabled={!line.product_id} />
              )}
            />
            <MuiTextField
              label="Qty received"
              type="number"
              value={line.quantity_received}
              onChange={(event) => updateLine(index, "quantity_received", event.target.value)}
              fullWidth
            />
            <MuiTextField
              label="Qty rejected"
              type="number"
              value={line.quantity_rejected}
              onChange={(event) => updateLine(index, "quantity_rejected", event.target.value)}
              fullWidth
            />
            <Button variant="outlined" onClick={() => removeLine(index)}>
              Remove
            </Button>
          </Stack>
        ))}
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={addLine}>
            Add line
          </Button>
          <Button variant="contained" onClick={submitReceive}>
            Receive shipment
          </Button>
        </Stack>
      </Stack>
    </ActionSection>
  );
}

function FinalizeShipmentPanel() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();

  const finalize = async () => {
    if (!record?.id) return;
    const response = await apiFetch(`/procurement/import-shipments/${record.id}/finalize`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() }
    });
    if (!response.ok) {
      const message = (response.data as any)?.message || `Finalize failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }
    notify("Shipment finalized", { type: "success" });
    refresh();
  };

  return (
    <ActionSection title="Finalize shipment">
      <Button variant="contained" onClick={finalize}>
        Finalize shipment
      </Button>
    </ActionSection>
  );
}

export function ImportShipmentList() {
  return (
    <List filters={shipmentFilters} perPage={50}>
      <Datagrid rowClick="show">
        <TextField source="reference" />
        <TextField source="status" />
        <TextField source="supplier_id" />
        <TextField source="currency" />
        <NumberField source="fx_rate" />
        <DateField source="arrival_date" />
        <NumberField source="lines_count" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function ImportShipmentCreate() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canManageImports =
    permissionList.includes("*") || permissionList.includes("procurement.imports.manage");

  return (
    <Create>
      {canManageImports ? (
        <SimpleForm>
          <TextInput source="reference" validate={[required()]} fullWidth />
          <ReferenceInput source="supplier_id" reference="suppliers" allowEmpty>
            <AutocompleteInput
              optionText={(record) => (record?.name ? `${record.name} (${record.id})` : record?.id)}
              filterToQuery={(search) => ({ q: search })}
              fullWidth
            />
          </ReferenceInput>
          <TextInput source="currency" validate={[required()]} />
          <NumberInput source="fx_rate" validate={[required()]} />
          <DateInput source="arrival_date" />
          <ArrayInput source="lines">
            <SimpleFormIterator inline>
              <FormDataConsumer>
                {({ scopedFormData, getSource }) => (
                  <>
                    <ReferenceInput source={getSource("product_id")} reference="products">
                      <AutocompleteInput
                        optionText={(record) => (record?.name ? `${record.name} (${record.sku ?? record.id})` : record?.id)}
                        filterToQuery={(search) => ({ q: search })}
                        validate={[required()]}
                      />
                    </ReferenceInput>
                    <ReferenceInput
                      source={getSource("variant_id")}
                      reference="variants"
                      allowEmpty
                      filter={{ product_id: scopedFormData?.product_id }}
                    >
                      <AutocompleteInput
                        optionText={(record) =>
                          record?.size || record?.unit || record?.barcode
                            ? `${record?.size ?? ""}${record?.unit ? ` ${record.unit}` : ""}${record?.barcode ? ` - ${record.barcode}` : ""}`.trim()
                            : record?.id
                        }
                      />
                    </ReferenceInput>
                    <NumberInput source={getSource("quantity")} validate={[required()]} />
                    <NumberInput source={getSource("unit_cost")} validate={[required()]} />
                  </>
                )}
              </FormDataConsumer>
            </SimpleFormIterator>
          </ArrayInput>
        </SimpleForm>
      ) : (
        <SimpleForm toolbar={false}>
          <Box sx={{ paddingY: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You do not have permission to create import shipments.
            </Typography>
          </Box>
        </SimpleForm>
      )}
    </Create>
  );
}

export function ImportShipmentShow() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canManageImports =
    permissionList.includes("*") || permissionList.includes("procurement.imports.manage");

  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="reference" />
        <TextField source="status" />
        <TextField source="supplier_id" />
        <TextField source="currency" />
        <NumberField source="fx_rate" />
        <DateField source="arrival_date" />
        <DateField source="cleared_date" />
        <NumberField source="total_base_amount" />
        <NumberField source="total_landed_cost" />
        <ArrayField source="lines">
          <Datagrid>
            <TextField source="product_id" />
            <TextField source="variant_id" />
            <NumberField source="quantity" />
            <NumberField source="unit_cost" />
            <NumberField source="base_amount" />
            <NumberField source="landed_unit_cost" />
            <NumberField source="landed_amount" />
          </Datagrid>
        </ArrayField>
        <ArrayField source="costs">
          <Datagrid>
            <TextField source="category" />
            <NumberField source="amount" />
            <TextField source="notes" />
          </Datagrid>
        </ArrayField>
        {canManageImports ? (
          <>
            <AddCostsPanel />
            <ReceiveShipmentPanel />
            <FinalizeShipmentPanel />
          </>
        ) : (
          <Typography variant="body2" color="text.secondary">
            You do not have permission to manage import shipments.
          </Typography>
        )}
      </SimpleShowLayout>
    </Show>
  );
}
