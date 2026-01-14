"use client";

import {
  Create,
  Datagrid,
  DateField,
  List,
  SimpleForm,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";

const supplierFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export function SupplierList() {
  return (
    <List filters={supplierFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="contact_name" />
        <TextField source="contact_phone" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function SupplierCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required(), minLength(2)]} fullWidth />
        <TextInput source="contact_name" />
        <TextInput source="contact_phone" />
      </SimpleForm>
    </Create>
  );
}
