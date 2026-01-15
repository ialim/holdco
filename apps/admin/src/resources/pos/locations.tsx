"use client";

import { Create, Datagrid, DateField, List, SimpleForm, TextField, TextInput, required } from "react-admin";

const locationFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <TextInput key="subsidiary_id" source="subsidiary_id" label="Subsidiary ID" />,
  <TextInput key="type" source="type" label="Type" />
];

export function LocationList() {
  return (
    <List filters={locationFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="type" />
        <TextField source="subsidiary_id" />
        <TextField source="city" />
        <TextField source="state" />
        <TextField source="country" />
        <DateField source="updated_at" showTime />
      </Datagrid>
    </List>
  );
}

export function LocationCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="subsidiary_id" label="Subsidiary ID" validate={[required()]} fullWidth />
        <TextInput source="name" validate={[required()]} fullWidth />
        <TextInput source="type" validate={[required()]} fullWidth />
        <TextInput source="address_line1" label="Address line 1" fullWidth />
        <TextInput source="address_line2" label="Address line 2" fullWidth />
        <TextInput source="city" label="City" />
        <TextInput source="state" label="State" />
        <TextInput source="country" label="Country" />
      </SimpleForm>
    </Create>
  );
}
