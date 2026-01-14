"use client";

import {
  ArrayInput,
  AutocompleteInput,
  Create,
  Datagrid,
  Edit,
  List,
  ReferenceInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  required
} from "react-admin";

const variantFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

function VariantForm() {
  return (
    <>
      <ReferenceInput source="product_id" reference="products" validate={[required()]}>
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <TextInput source="size" />
      <TextInput source="unit" />
      <TextInput source="barcode" />
      <ArrayInput source="facets">
        <SimpleFormIterator inline>
          <TextInput source="key" label="Facet key" />
          <TextInput source="value" label="Facet value" />
        </SimpleFormIterator>
      </ArrayInput>
    </>
  );
}

export function VariantList() {
  return (
    <List filters={variantFilters} perPage={50}>
      <Datagrid rowClick="edit">
        <TextField source="product_id" />
        <TextField source="size" />
        <TextField source="unit" />
        <TextField source="barcode" />
      </Datagrid>
    </List>
  );
}

export function VariantCreate() {
  return (
    <Create>
      <SimpleForm>
        <VariantForm />
      </SimpleForm>
    </Create>
  );
}

export function VariantEdit() {
  return (
    <Edit>
      <SimpleForm>
        <VariantForm />
      </SimpleForm>
    </Edit>
  );
}
