"use client";

import { useEffect, useState } from "react";
import {
  ArrayField,
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  DateInput,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  Show,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  useInput,
  usePermissions,
  required,
} from "react-admin";
import { Autocomplete, Box, TextField as MuiTextField, Typography } from "@mui/material";
import { apiFetch } from "../../lib/api";

const invoiceFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <TextInput key="status" source="status" label="Status" />,
];

export function SupplierInvoiceList() {
  return (
    <List filters={invoiceFilters} perPage={50}>
      <Datagrid rowClick="show">
        <TextField source="reference" />
        <TextField source="status" />
        <TextField source="supplier_name" label="Supplier" />
        <TextField source="vendor_name" label="Vendor" />
        <NumberField source="total_amount" />
        <NumberField source="paid_amount" />
        <NumberField source="balance_amount" />
        <DateField source="issue_date" />
        <DateField source="due_date" />
      </Datagrid>
    </List>
  );
}

export function SupplierInvoiceCreate() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canManage = permissionList.includes("*") || permissionList.includes("procurement.payments.manage");

  const VendorSelect = () => {
    const { field } = useInput({ source: "vendor_id" });
    const [options, setOptions] = useState<Array<{ id: string; label: string }>>([]);

    const loadVendors = async (query: string) => {
      const params = new URLSearchParams({ limit: "20", type: "vendor" });
      if (query) params.set("q", query);
      const response = await apiFetch(`/third-parties?${params.toString()}`);
      if (!response.ok) return;
      const items = (response.data as any)?.data ?? [];
      const nextOptions = Array.isArray(items)
        ? items.map((item: any) => ({
            id: item.id,
            label: item.name ? `${item.name} (${item.id})` : item.id,
          }))
        : [];
      setOptions(nextOptions);
    };

    useEffect(() => {
      loadVendors("");
    }, []);

    return (
      <Autocomplete
        options={options}
        value={options.find((option) => option.id === field.value) ?? null}
        onChange={(_, option) => field.onChange(option?.id ?? "")}
        onInputChange={(_, value) => {
          loadVendors(value);
        }}
        isOptionEqualToValue={(option, value) => option.id === value.id}
        renderInput={(params) => <MuiTextField {...params} label="Vendor (External Client)" fullWidth />}
      />
    );
  };

  return (
    <Create>
      {canManage ? (
        <SimpleForm>
          <TextInput source="reference" validate={[required()]} fullWidth />
          <ReferenceInput source="supplier_id" reference="suppliers" allowEmpty>
            <AutocompleteInput
              optionText={(record) => (record?.name ? `${record.name} (${record.id})` : record?.id)}
              filterToQuery={(search) => ({ q: search })}
              fullWidth
            />
          </ReferenceInput>
          <VendorSelect />
          <ReferenceInput source="purchase_order_id" reference="procurement/purchase-orders" allowEmpty>
            <AutocompleteInput
              optionText={(record) =>
                record?.id ? `${record.id} (${record?.status ?? "draft"})` : record?.id
              }
              filterToQuery={(search) => ({ q: search })}
              fullWidth
            />
          </ReferenceInput>
          <ReferenceInput source="import_shipment_id" reference="procurement/import-shipments" allowEmpty>
            <AutocompleteInput
              optionText={(record) =>
                record?.reference ? `${record.reference} (${record?.status ?? "draft"})` : record?.id
              }
              filterToQuery={(search) => ({ q: search })}
              fullWidth
            />
          </ReferenceInput>
          <TextInput source="currency" defaultValue="NGN" />
          <NumberInput source="fx_rate" defaultValue={1} />
          <NumberInput source="subtotal_amount" validate={[required()]} />
          <NumberInput source="tax_amount" defaultValue={0} />
          <NumberInput source="total_amount" helperText="Leave blank to subtotal + tax." />
          <TextInput source="expense_account_code" defaultValue="1200" />
          <TextInput source="payable_account_code" defaultValue="2000" />
          <DateInput source="issue_date" />
          <DateInput source="due_date" />
          <TextInput source="notes" multiline minRows={2} fullWidth />
        </SimpleForm>
      ) : (
        <SimpleForm toolbar={false}>
          <Box sx={{ paddingY: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You do not have permission to create supplier invoices.
            </Typography>
          </Box>
        </SimpleForm>
      )}
    </Create>
  );
}

export function SupplierInvoiceShow() {
  return (
    <Show>
      <SimpleShowLayout>
        <TextField source="reference" />
        <TextField source="status" />
        <TextField source="supplier_name" label="Supplier" />
        <TextField source="vendor_name" label="Vendor" />
        <TextField source="currency" />
        <NumberField source="fx_rate" />
        <NumberField source="subtotal_amount" />
        <NumberField source="tax_amount" />
        <NumberField source="total_amount" />
        <NumberField source="paid_amount" />
        <NumberField source="balance_amount" />
        <DateField source="issue_date" />
        <DateField source="due_date" />
        <TextField source="notes" />
        <ArrayField source="payments">
          <Datagrid rowClick={false}>
            <NumberField source="amount" />
            <TextField source="currency" />
            <DateField source="paid_at" showTime />
            <TextField source="method" />
            <TextField source="reference" />
          </Datagrid>
        </ArrayField>
      </SimpleShowLayout>
    </Show>
  );
}
