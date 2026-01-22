"use client";

import {
  Create,
  Datagrid,
  DateField,
  DateInput,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SimpleForm,
  TextField,
  TextInput,
  usePermissions,
  required,
  AutocompleteInput,
} from "react-admin";
import { Box, Typography } from "@mui/material";

export function SupplierPaymentList() {
  return (
    <List perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="invoice_reference" label="Invoice" />
        <TextField source="supplier_name" label="Supplier" />
        <TextField source="vendor_name" label="Vendor" />
        <NumberField source="amount" />
        <TextField source="currency" />
        <TextField source="method" />
        <DateField source="paid_at" showTime />
        <TextField source="reference" />
      </Datagrid>
    </List>
  );
}

export function SupplierPaymentCreate() {
  const { permissions } = usePermissions();
  const permissionList = Array.isArray(permissions) ? permissions.map(String) : [];
  const canManage = permissionList.includes("*") || permissionList.includes("procurement.payments.manage");

  return (
    <Create>
      {canManage ? (
        <SimpleForm>
          <ReferenceInput source="supplier_invoice_id" reference="procurement/supplier-invoices">
            <AutocompleteInput
              optionText={(record) => (record?.reference ? `${record.reference} (${record.id})` : record?.id)}
              filterToQuery={(search) => ({ q: search })}
              validate={[required()]}
              fullWidth
            />
          </ReferenceInput>
          <NumberInput source="amount" validate={[required()]} />
          <TextInput source="currency" />
          <DateInput source="paid_at" />
          <TextInput source="method" />
          <TextInput source="reference" />
          <TextInput source="payment_account_code" defaultValue="1000" />
          <TextInput source="notes" multiline minRows={2} fullWidth />
        </SimpleForm>
      ) : (
        <SimpleForm toolbar={false}>
          <Box sx={{ paddingY: 2 }}>
            <Typography variant="body2" color="text.secondary">
              You do not have permission to create supplier payments.
            </Typography>
          </Box>
        </SimpleForm>
      )}
    </Create>
  );
}
