"use client";

import {
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  NumberInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";
import { formatJson, parseJson, validateJson } from "./json-utils";

const statusChoices = [
  { id: "active", name: "active" },
  { id: "inactive", name: "inactive" }
];

const categoryFilters = [
  <TextInput key="q" source="q" label="Search" alwaysOn />,
  <SelectInput key="status" source="status" choices={statusChoices} />
];

function CategoryForm() {
  return (
    <>
      <TextInput source="code" validate={[required(), minLength(2)]} fullWidth />
      <TextInput source="name" validate={[required(), minLength(2)]} fullWidth />
      <TextInput source="description" multiline minRows={3} fullWidth />
      <SelectInput source="status" choices={statusChoices} />
      <NumberInput source="sort_order" />
      <TextInput
        source="product_filters"
        label="Product filters (JSON)"
        multiline
        minRows={4}
        fullWidth
        parse={parseJson}
        format={formatJson}
        validate={validateJson}
      />
      <TextInput
        source="variant_filters"
        label="Variant filters (JSON)"
        multiline
        minRows={4}
        fullWidth
        parse={parseJson}
        format={formatJson}
        validate={validateJson}
      />
    </>
  );
}

export function CategoryList() {
  return (
    <List filters={categoryFilters} perPage={100} sort={{ field: "sort_order", order: "ASC" }}>
      <Datagrid rowClick="edit">
        <TextField source="code" />
        <TextField source="name" />
        <TextField source="status" />
        <TextField source="sort_order" />
        <DateField source="updated_at" showTime />
      </Datagrid>
    </List>
  );
}

export function CategoryCreate() {
  return (
    <Create>
      <SimpleForm>
        <CategoryForm />
      </SimpleForm>
    </Create>
  );
}

export function CategoryEdit() {
  return (
    <Edit>
      <SimpleForm>
        <CategoryForm />
      </SimpleForm>
    </Edit>
  );
}
