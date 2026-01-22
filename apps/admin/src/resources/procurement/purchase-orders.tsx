"use client";

import { useEffect, useState } from "react";
import {
  ArrayInput,
  Create,
  Datagrid,
  DateField,
  DateInput,
  List,
  NumberField,
  NumberInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  useInput,
  usePermissions,
  required
} from "react-admin";
import { Autocomplete, Box, TextField as MuiTextField, Typography } from "@mui/material";
import { apiFetch } from "../../lib/api";

const orderFilters = [
  <TextInput key="status" source="status" label="Status" />,
  <DateInput key="start_date" source="start_date" label="Start date" />,
  <DateInput key="end_date" source="end_date" label="End date" />
];

export function PurchaseOrderList() {
  return (
    <List filters={orderFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="status" />
        <TextField source="vendor_id" />
        <DateField source="ordered_at" />
        <DateField source="expected_at" />
        <TextField source="currency" />
        <NumberField source="items_count" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function PurchaseOrderCreate() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canManage =
    permissionList.includes("*") || permissionList.includes("procurement.order.manage");

  const VendorSelect = () => {
    const { field } = useInput({ source: "vendor_id", validate: required() });
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
            label: item.name ? `${item.name} (${item.id})` : item.id
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
        renderInput={(params) => <MuiTextField {...params} label="Vendor" required fullWidth />}
      />
    );
  };

  return (
    <Create>
      {canManage ? (
        <SimpleForm>
          <VendorSelect />
          <DateInput source="ordered_at" />
          <DateInput source="expected_at" />
          <TextInput source="currency" />
          <ArrayInput source="items">
            <SimpleFormIterator inline>
              <TextInput source="description" validate={[required()]} />
              <NumberInput source="quantity" validate={[required()]} />
              <NumberInput source="unit_price" validate={[required()]} />
              <NumberInput source="total_price" helperText="Optional; auto-calculated if left blank." />
            </SimpleFormIterator>
          </ArrayInput>
        </SimpleForm>
      ) : (
        <SimpleForm toolbar={false}>
          <Box sx={{ paddingY: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You do not have permission to create purchase orders.
            </Typography>
          </Box>
        </SimpleForm>
      )}
    </Create>
  );
}
