"use client";

import { Datagrid, DateField, List, TextField, TextInput } from "react-admin";

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
