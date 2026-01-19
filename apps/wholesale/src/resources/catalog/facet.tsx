"use client";

import {
  Create,
  Datagrid,
  DateField,
  List,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";

const facetFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

const scopeChoices = [
  { id: "product", name: "product" },
  { id: "variant", name: "variant" }
];

const dataTypeChoices = [{ id: "text", name: "text" }];

export function FacetList() {
  return (
    <List filters={facetFilters} perPage={50}>
      <Datagrid rowClick={false}>
        <TextField source="key" />
        <TextField source="name" />
        <TextField source="scope" />
        <TextField source="data_type" />
        <TextField source="status" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function FacetCreate() {
  return (
    <Create>
      <SimpleForm>
        <TextInput source="key" validate={[required(), minLength(2)]} fullWidth />
        <TextInput source="name" validate={[required(), minLength(2)]} fullWidth />
        <SelectInput source="scope" choices={scopeChoices} />
        <SelectInput source="data_type" choices={dataTypeChoices} />
      </SimpleForm>
    </Create>
  );
}
