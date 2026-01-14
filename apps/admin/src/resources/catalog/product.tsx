"use client";

import {
  ArrayInput,
  AutocompleteInput,
  Create,
  Datagrid,
  DateField,
  Edit,
  List,
  ReferenceInput,
  SimpleForm,
  SimpleFormIterator,
  TextField,
  TextInput,
  minLength,
  required
} from "react-admin";

const productFilters = [<TextInput key="q" source="q" label="Search" alwaysOn />];

function ProductForm() {
  return (
    <>
      <TextInput source="sku" validate={[required(), minLength(3)]} fullWidth />
      <TextInput source="name" validate={[required(), minLength(2)]} fullWidth />
      <ReferenceInput source="brand_id" reference="brands" allowEmpty>
        <AutocompleteInput optionText="name" />
      </ReferenceInput>
      <TextInput source="sex" />
      <TextInput source="concentration" />
      <TextInput source="type" />
      <ArrayInput source="facets">
        <SimpleFormIterator inline>
          <TextInput source="key" label="Facet key" />
          <TextInput source="value" label="Facet value" />
        </SimpleFormIterator>
      </ArrayInput>
    </>
  );
}

export function ProductList() {
  return (
    <List filters={productFilters} perPage={50}>
      <Datagrid rowClick="edit">
        <TextField source="sku" />
        <TextField source="name" />
        <TextField source="brand_id" />
        <TextField source="status" />
        <DateField source="created_at" showTime />
      </Datagrid>
    </List>
  );
}

export function ProductCreate() {
  return (
    <Create>
      <SimpleForm>
        <ProductForm />
      </SimpleForm>
    </Create>
  );
}

export function ProductEdit() {
  return (
    <Edit>
      <SimpleForm>
        <ProductForm />
      </SimpleForm>
    </Edit>
  );
}
