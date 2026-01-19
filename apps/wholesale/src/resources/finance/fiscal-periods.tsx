"use client";

import { Create, Datagrid, DateField, DateInput, List, SelectInput, SimpleForm, TextField, TextInput, required } from "react-admin";

const periodStatusChoices = [
  { id: "open", name: "open" },
  { id: "closed", name: "closed" },
  { id: "locked", name: "locked" }
];

const periodFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

export function FiscalPeriodsList() {
  return (
    <List filters={periodFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <DateField source="start_date" />
        <DateField source="end_date" />
        <TextField source="status" />
      </Datagrid>
    </List>
  );
}

export function FiscalPeriodsCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required()]} fullWidth />
        <DateInput source="start_date" validate={[required()]} />
        <DateInput source="end_date" validate={[required()]} />
        <SelectInput source="status" choices={periodStatusChoices} />
      </SimpleForm>
    </Create>
  );
}
