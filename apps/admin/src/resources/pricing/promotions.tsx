"use client";

import {
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  List,
  NumberField,
  NumberInput,
  SimpleForm,
  TextField,
  TextInput,
  required
} from "react-admin";

export function PromotionList() {
  return (
    <List perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="code" />
        <TextField source="type" />
        <NumberField source="value" />
        <DateField source="start_at" />
        <DateField source="end_at" />
      </Datagrid>
    </List>
  );
}

export function PromotionCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="code" validate={[required()]} fullWidth />
        <TextInput source="type" validate={[required()]} fullWidth />
        <NumberInput source="value" validate={[required()]} fullWidth />
        <DateTimeInput source="start_at" validate={[required()]} fullWidth />
        <DateTimeInput source="end_at" validate={[required()]} fullWidth />
      </SimpleForm>
    </Create>
  );
}
