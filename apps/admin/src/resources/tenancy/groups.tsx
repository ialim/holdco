"use client";

import { Datagrid, DateField, List, TextField, TextInput } from "react-admin";

const groupFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export function TenantGroupList() {
  return (
    <List filters={groupFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="id" />
        <DateField source="created_at" label="Created" showTime />
      </Datagrid>
    </List>
  );
}
