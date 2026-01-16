"use client";

import {
  Create,
  Datagrid,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required
} from "react-admin";

const statusChoices = [
  { id: "active", name: "active" },
  { id: "inactive", name: "inactive" },
  { id: "suspended", name: "suspended" }
];

const resellerFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput key="status" source="status" choices={statusChoices} />
];

export function ResellerList() {
  return (
    <List filters={resellerFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="status" />
        <TextField source="id" />
      </Datagrid>
    </List>
  );
}

export function ResellerCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required()]} fullWidth />
        <SelectInput source="status" choices={statusChoices} fullWidth />
      </SimpleForm>
    </Create>
  );
}
