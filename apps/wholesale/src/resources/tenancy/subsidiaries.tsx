"use client";

import { BooleanInput, Create, Datagrid, List, SelectInput, SimpleForm, TextField, TextInput, required } from "react-admin";

const subsidiaryFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

const roleChoices = [
  { id: "HOLDCO", name: "HOLDCO" },
  { id: "PROCUREMENT_TRADING", name: "PROCUREMENT_TRADING" },
  { id: "RETAIL", name: "RETAIL" },
  { id: "RESELLER", name: "RESELLER" },
  { id: "DIGITAL_COMMERCE", name: "DIGITAL_COMMERCE" },
  { id: "LOGISTICS", name: "LOGISTICS" }
];

const statusChoices = [
  { id: "active", name: "active" },
  { id: "inactive", name: "inactive" }
];

export function SubsidiaryList() {
  return (
    <List filters={subsidiaryFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="name" />
        <TextField source="role" />
        <TextField source="status" />
      </Datagrid>
    </List>
  );
}

export function SubsidiaryCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="name" validate={[required()]} fullWidth />
        <SelectInput source="role" choices={roleChoices} validate={[required()]} fullWidth />
        <SelectInput source="status" choices={statusChoices} />
        <BooleanInput source="create_default_location" label="Create default location" defaultValue />
        <TextInput source="location.name" label="Location name" fullWidth />
        <TextInput source="location.type" label="Location type" fullWidth />
        <TextInput source="location.address_line1" label="Address line 1" fullWidth />
        <TextInput source="location.address_line2" label="Address line 2" fullWidth />
        <TextInput source="location.city" label="City" />
        <TextInput source="location.state" label="State" />
        <TextInput source="location.country" label="Country" />
      </SimpleForm>
    </Create>
  );
}
