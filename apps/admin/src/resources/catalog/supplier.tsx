"use client";

import {
  Create,
  Datagrid,
  DateField,
  List,
  SelectField,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";

const originChoices = [
  { id: "domestic", name: "Domestic" },
  { id: "foreign", name: "Foreign" }
];

const supplierFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput key="origin" source="origin" choices={originChoices} />
];

export function SupplierList() {
  return (
    <List filters={supplierFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <SelectField source="origin" choices={originChoices} />
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
        <SelectInput source="origin" choices={originChoices} defaultValue="domestic" />
        <TextInput source="contact_name" />
        <TextInput source="contact_phone" />
      </SimpleForm>
    </Create>
  );
}
