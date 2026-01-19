"use client";

import { Create, Datagrid, DateField, List, SimpleForm, TextField, TextInput, minLength, required } from "react-admin";

const brandFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export function BrandList() {
  return (
    <List filters={brandFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function BrandCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required(), minLength(2)]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
