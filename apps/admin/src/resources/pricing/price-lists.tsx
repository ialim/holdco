"use client";

import {
  Create,
  DateField,
  DateInput,
  Datagrid,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";

const channelChoices = [
  { id: "retail", name: "retail" },
  { id: "wholesale", name: "wholesale" },
  { id: "digital", name: "digital" },
  { id: "admin_ops", name: "admin_ops" }
];

export function PriceListList() {
  return (
    <List perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="currency" />
        <TextField source="channel" />
        <DateField source="valid_from" />
        <DateField source="valid_to" />
      </Datagrid>
    </List>
  );
}

export function PriceListCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required(), minLength(2)]} fullWidth />
        <TextInput source="currency" validate={[required()]} helperText="ISO currency code (e.g. NGN)" fullWidth />
        <SelectInput source="channel" choices={channelChoices} allowEmpty fullWidth />
        <DateInput source="valid_from" fullWidth />
        <DateInput source="valid_to" fullWidth />
      </SimpleForm>
    </Create>
  );
}
