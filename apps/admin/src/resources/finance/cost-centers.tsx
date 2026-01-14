"use client";

import { Create, Datagrid, List, SimpleForm, TextField, TextInput, required } from "react-admin";

const costCenterFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export function CostCentersList() {
  return (
    <List filters={costCenterFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="code" />
        <TextField source="name" />
        <TextField source="status" />
      </Datagrid>
    </List>
  );
}

export function CostCentersCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="code" validate={[required()]} fullWidth />
        <TextInput source="name" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
