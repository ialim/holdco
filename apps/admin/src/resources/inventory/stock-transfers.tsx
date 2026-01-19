"use client";

import {
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
  useNotify,
  useRecordContext,
  useRefresh
} from "react-admin";
import { Button } from "@mui/material";
import { useState } from "react";
import { apiFetch } from "../../lib/api";
import { newIdempotencyKey } from "../../lib/idempotency";

const transferFilters = [
  <TextInput key="status" source="status" label="Status" />,
  <TextInput key="product_id" source="product_id" label="Product ID" />,
  <TextInput key="variant_id" source="variant_id" label="Variant ID" />
];

function CompleteTransferButton() {
  const record = useRecordContext();
  const notify = useNotify();
  const refresh = useRefresh();
  const [loading, setLoading] = useState(false);

  const completeTransfer = async () => {
    if (!record?.id) return;
    setLoading(true);
    const response = await apiFetch(`/transfers/${record.id}/complete`, {
      method: "POST",
      headers: { "Idempotency-Key": newIdempotencyKey() }
    });
    setLoading(false);

    if (!response.ok) {
      const message = (response.data as any)?.message || `Request failed (${response.status})`;
      notify(message, { type: "error" });
      return;
    }

    notify("Transfer completed", { type: "success" });
    refresh();
  };

  return (
    <Button
      size="small"
      variant="outlined"
      onClick={completeTransfer}
      disabled={loading || record?.status === "completed"}
    >
      Complete
    </Button>
  );
}

export function StockTransferList() {
  return (
    <List perPage={50} filters={transferFilters}>
      <Datagrid rowClick={false}>
        <TextField source="status" />
        <TextField source="product_name" />
        <TextField source="product_sku" />
        <TextField source="variant_label" />
        <TextField source="from_location_name" />
        <TextField source="to_location_name" />
        <NumberField source="quantity" />
        <DateField source="created_at" />
        <CompleteTransferButton />
      </Datagrid>
    </List>
  );
}

export function StockTransferCreate() {
  return (
    <Create>
      <SimpleForm>
        <ReferenceInput source="product_id" reference="products">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.sku ?? record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
          />
        </ReferenceInput>
        <ReferenceInput source="variant_id" reference="variants" allowEmpty>
          <AutocompleteInput
            optionText={(record) =>
              record?.size || record?.unit || record?.barcode
                ? `${record?.size ?? ""}${record?.unit ? ` ${record.unit}` : ""}${record?.barcode ? ` - ${record.barcode}` : ""}`.trim()
                : record?.id
            }
          />
        </ReferenceInput>
        <ReferenceInput source="from_location_id" reference="locations">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
          />
        </ReferenceInput>
        <ReferenceInput source="to_location_id" reference="locations">
          <AutocompleteInput
            optionText={(record) => (record?.name ? `${record.name} (${record.id})` : record?.id)}
            filterToQuery={(search) => ({ q: search })}
            validate={[required()]}
          />
        </ReferenceInput>
        <NumberInput source="quantity" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
