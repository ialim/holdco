"use client";

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
  required
} from "react-admin";

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
  return (
    <Create>
      <SimpleForm>
        <TextInput source="vendor_id" label="Vendor ID" validate={[required()]} fullWidth />
        <DateInput source="ordered_at" />
        <DateInput source="expected_at" />
        <TextInput source="currency" />
        <ArrayInput source="items">
          <SimpleFormIterator inline>
            <TextInput source="description" validate={[required()]} />
            <NumberInput source="quantity" validate={[required()]} />
            <NumberInput source="unit_price" validate={[required()]} />
            <NumberInput source="total_price" />
          </SimpleFormIterator>
        </ArrayInput>
      </SimpleForm>
    </Create>
  );
}
